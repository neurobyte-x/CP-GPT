"""Chat / conversation schemas."""

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Request schemas ──────────────────────────────────────────────


class ConversationCreate(BaseModel):
    """Create a new conversation (optional title)."""

    title: Optional[str] = Field(None, max_length=200)


class ChatRequest(BaseModel):
    """Send a message in a conversation."""

    message: str = Field(..., min_length=1, max_length=5000)


# ── Response schemas ─────────────────────────────────────────────


class MessageResponse(BaseModel):
    """A single chat message."""

    id: int
    conversation_id: uuid.UUID
    role: str
    content: str
    metadata_: Optional[dict[str, Any]] = Field(None, alias="metadata_")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ConversationResponse(BaseModel):
    """Conversation summary (for list view)."""

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: Optional[str] = None

    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    """Conversation with messages."""

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    model_config = {"from_attributes": True}


class ChatResponse(BaseModel):
    """Response after sending a message — includes the assistant reply."""

    user_message: MessageResponse
    assistant_message: MessageResponse
