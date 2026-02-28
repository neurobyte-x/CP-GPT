"""
Chat API endpoints — the conversational interface to the AI coach.

Endpoints:
  GET    /chat/conversations              — List user's conversations
  POST   /chat/conversations              — Create a new conversation
  GET    /chat/conversations/{id}         — Get conversation with messages
  DELETE /chat/conversations/{id}         — Delete a conversation
  POST   /chat/conversations/{id}/messages — Send a message (agent processes & replies)
  PATCH  /chat/conversations/{id}         — Update conversation title
"""

import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func as sqlfunc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.schemas.conversation import (
    ChatRequest,
    ChatResponse,
    ConversationCreate,
    ConversationDetailResponse,
    ConversationResponse,
    MessageResponse,
)
from app.services.agent import agent_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List all conversations for the current user, newest first."""
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()

    # Build response with message count and preview
    response = []
    for conv in conversations:
        msg_count = len(conv.messages) if conv.messages else 0
        last_preview = None
        if conv.messages:
            last_msg = conv.messages[-1]
            last_preview = last_msg.content[:100] + (
                "..." if len(last_msg.content) > 100 else ""
            )

        response.append(
            ConversationResponse(
                id=conv.id,
                title=conv.title,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                message_count=msg_count,
                last_message_preview=last_preview,
            )
        )

    return response


@router.post(
    "/conversations",
    response_model=ConversationDetailResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new conversation."""
    conv = Conversation(
        user_id=user.id,
        title=body.title or "New Conversation",
    )
    db.add(conv)
    await db.flush()
    await db.refresh(conv)

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[],
    )


@router.get(
    "/conversations/{conversation_id}", response_model=ConversationDetailResponse
)
async def get_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get a conversation with all its messages."""
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                metadata_=m.metadata_,
                created_at=m.created_at,
            )
            for m in conv.messages
        ],
    )


@router.delete(
    "/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update conversation title."""
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if body.title:
        conv.title = body.title

    await db.flush()
    await db.refresh(conv)

    msg_count = len(conv.messages) if conv.messages else 0
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=msg_count,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ChatResponse,
)
async def send_message(
    conversation_id: uuid.UUID,
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Send a message in a conversation.
    The AI agent processes it and returns a reply.
    """
    # Verify conversation belongs to user
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == user.id,
            )
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save the user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.flush()
    await db.refresh(user_msg)

    # Auto-generate title from first message
    if conv.title == "New Conversation":
        conv.title = body.message[:60].strip()
        if len(body.message) > 60:
            conv.title += "..."

    # Build conversation history (last 20 messages for context)
    history = []
    recent_messages = (conv.messages or [])[-20:]
    for m in recent_messages:
        # Skip the message we just added (it's passed separately)
        if m.id == user_msg.id:
            continue
        history.append({"role": m.role, "content": m.content})

    # Run the agent
    try:
        agent_result = await agent_service.process_message(
            db=db,
            user=user,
            user_message=body.message,
            conversation_history=history,
        )
    except Exception as e:
        logger.error(f"Agent error: {e}")
        agent_result = {
            "content": "Sorry, I encountered an error processing your request. Please try again.",
            "metadata": None,
        }

    # Save the assistant message
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=agent_result["content"],
        metadata_=agent_result.get("metadata"),
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    return ChatResponse(
        user_message=MessageResponse(
            id=user_msg.id,
            conversation_id=user_msg.conversation_id,
            role=user_msg.role,
            content=user_msg.content,
            metadata_=user_msg.metadata_,
            created_at=user_msg.created_at,
        ),
        assistant_message=MessageResponse(
            id=assistant_msg.id,
            conversation_id=assistant_msg.conversation_id,
            role=assistant_msg.role,
            content=assistant_msg.content,
            metadata_=assistant_msg.metadata_,
            created_at=assistant_msg.created_at,
        ),
    )
