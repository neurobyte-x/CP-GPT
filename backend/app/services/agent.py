"""
AI Agent service — the core autonomous coaching engine.

Uses Gemini's native function calling to create an agent loop:
  1. Send user message + conversation history to Gemini
  2. If Gemini returns function calls → execute tools → send results back
  3. Repeat until Gemini returns a text response (max iterations)
  4. Return the final text + any metadata (problem cards, tool call log)

Tools available to the agent:
  - search_problems: Search Codeforces problems by tags, rating, etc.
  - get_problem_details: Get detailed info on a specific problem
  - find_similar_problems: Find problems similar to a given one
  - get_user_stats: Get the user's overall solving statistics
  - get_topic_strengths: Get per-topic skill estimates
  - get_solved_history: Get recently solved problems
  - get_available_tags: List all topic tags in the database
"""

import json
import logging
import uuid
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.user import User

logger = logging.getLogger(__name__)
settings = get_settings()

# ── System Prompt ────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are an expert competitive programming coach embedded in the CP Path Builder platform. \
Your job is to help users improve at competitive programming through personalized guidance.

## Your capabilities (via tools):
- Search the local Codeforces problem database by topic tags, difficulty rating, and more
- Look up detailed info on specific problems
- Find problems similar to a given problem
- Analyze the user's solving history, topic strengths, and weaknesses
- List all available topic tags

## Core rules:
1. **ALWAYS use tools** to find real problems. NEVER invent problem names, IDs, or URLs.
2. **Be a coach, not a solver.** Guide users to think through problems themselves.
3. **Hint ladder:** When a user is stuck, use progressive hints:
   - Level 1: Conceptual nudge ("Think about what data structure fits here")
   - Level 2: Approach direction ("Consider a greedy approach based on sorting")
   - Level 3: Key insight ("The key observation is that the sequence is monotonic after...")
   - Level 4: Detailed walkthrough (step-by-step reasoning, no code)
   - Level 5: Full solution (ONLY when user explicitly asks for the solution)
4. **Keep text brief** when returning problem lists — the UI renders problem cards from metadata. \
   Just provide a short intro like "Here are 5 sliding window problems around rating 1400:" and \
   let the cards speak for themselves.
5. **Use data** from the user's profile when available. Reference their stats, weak topics, \
   and solved history to personalize recommendations.
6. **Be concise.** Competitive programmers value brevity and precision.
7. **When recommending problems**, try to exclude problems the user has already solved \
   (pass their user ID to the exclude_solved_by parameter).

## User context:
- Username: {username}
- Codeforces handle: {cf_handle}
- Estimated rating: {estimated_rating}
- User ID (for tool calls): {user_id}
"""

# ── Tool Declarations (Gemini function calling format) ───────────

TOOL_DECLARATIONS = [
    {
        "name": "search_problems",
        "description": (
            "Search Codeforces problems in the local database. "
            "Use this to find problems by topic, difficulty rating, etc. "
            "Returns a list of problems with their tags, ratings, and URLs."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "tags": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"},
                    "description": "Topic tags to filter by (e.g., ['dp', 'greedy']). Problem must match ALL tags.",
                },
                "min_rating": {
                    "type": "INTEGER",
                    "description": "Minimum problem rating (800-3500)",
                },
                "max_rating": {
                    "type": "INTEGER",
                    "description": "Maximum problem rating (800-3500)",
                },
                "exclude_solved_by": {
                    "type": "STRING",
                    "description": "User UUID to exclude already-solved problems for",
                },
                "search_query": {
                    "type": "STRING",
                    "description": "Text search on problem name",
                },
                "sort_by": {
                    "type": "STRING",
                    "description": "Sort order: 'rating', 'solved_count', or 'educational_score' (default)",
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Max number of results (default 10, max 20)",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_problem_details",
        "description": (
            "Get detailed information about a specific Codeforces problem. "
            "Can look up by internal ID or by contest_id + problem_index."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "problem_id": {
                    "type": "INTEGER",
                    "description": "Internal database problem ID",
                },
                "contest_id": {
                    "type": "INTEGER",
                    "description": "Codeforces contest ID (e.g., 1920)",
                },
                "problem_index": {
                    "type": "STRING",
                    "description": "Problem index within contest (e.g., 'A', 'B', 'C1')",
                },
            },
            "required": [],
        },
    },
    {
        "name": "find_similar_problems",
        "description": (
            "Find problems similar to a given problem based on tag overlap and rating proximity. "
            "Useful for suggesting practice after a user solves or struggles with a specific problem."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "problem_id": {
                    "type": "INTEGER",
                    "description": "Internal database ID of the reference problem",
                },
                "exclude_solved_by": {
                    "type": "STRING",
                    "description": "User UUID to exclude already-solved problems",
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Max number of results (default 10)",
                },
            },
            "required": ["problem_id"],
        },
    },
    {
        "name": "get_user_stats",
        "description": (
            "Get the user's overall solving statistics: total solved, total attempted, "
            "and rating distribution of solved problems."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "user_id": {
                    "type": "STRING",
                    "description": "User UUID",
                },
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_topic_strengths",
        "description": (
            "Get per-topic skill estimates for a user. Returns topics sorted by skill "
            "(weakest first). Includes estimated skill rating, problems solved, etc."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "user_id": {
                    "type": "STRING",
                    "description": "User UUID",
                },
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_solved_history",
        "description": (
            "Get the user's recently solved problems. Optionally filter by topic tag."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "user_id": {
                    "type": "STRING",
                    "description": "User UUID",
                },
                "limit": {
                    "type": "INTEGER",
                    "description": "Max number of results (default 20)",
                },
                "tag_filter": {
                    "type": "STRING",
                    "description": "Filter by topic tag name (e.g., 'dp')",
                },
            },
            "required": ["user_id"],
        },
    },
    {
        "name": "get_available_tags",
        "description": (
            "List all topic tags available in the Codeforces problem database. "
            "Use this to validate tag names before searching."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": [],
        },
    },
]

# Max tool-call iterations per request
MAX_AGENT_ITERATIONS = 5


class AgentService:
    """AI coaching agent using Gemini function calling."""

    def __init__(self):
        self._client = None

    async def _get_client(self):
        """Lazy-init the Google GenAI client."""
        if self._client is None:
            from google import genai

            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    async def process_message(
        self,
        db: AsyncSession,
        user: User,
        user_message: str,
        conversation_history: list[dict],
    ) -> dict:
        """
        Process a user message through the agent loop.

        Args:
            db: Database session
            user: Current user
            user_message: The new message from the user
            conversation_history: Previous messages [{role, content}, ...]

        Returns:
            dict with:
              - content: The assistant's text response
              - metadata: {problems: [...], tool_calls: [...]}
        """
        if not settings.GEMINI_API_KEY:
            return {
                "content": "AI coaching requires a Gemini API key to be configured. "
                "Please contact the administrator.",
                "metadata": None,
            }

        from google.genai import types

        client = await self._get_client()

        # Build system prompt with user context
        system_prompt = SYSTEM_PROMPT.format(
            username=user.username,
            cf_handle=user.cf_handle or "Not linked",
            estimated_rating=user.estimated_rating or "Unknown",
            user_id=str(user.id),
        )

        # Build conversation contents for Gemini
        contents = self._build_contents(conversation_history, user_message)

        # Build tool config
        tools = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name=t["name"],
                    description=t["description"],
                    parameters=t["parameters"],
                )
                for t in TOOL_DECLARATIONS
            ]
        )

        # Agent loop
        tool_call_log = []
        collected_problems = []
        final_text = ""
        text_parts: list[str] = []
        iteration = 0

        while iteration < MAX_AGENT_ITERATIONS:
            iteration += 1

            try:
                response = await client.aio.models.generate_content(
                    model=settings.LLM_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        tools=[tools],
                        temperature=settings.LLM_TEMPERATURE,
                        max_output_tokens=2048,
                    ),
                )
            except Exception as e:
                logger.error(f"Gemini API error: {e}")
                return {
                    "content": "I'm having trouble connecting to the AI service. Please try again.",
                    "metadata": None,
                }

            # Check if response has function calls
            candidate = response.candidates[0] if response.candidates else None
            if not candidate or not candidate.content or not candidate.content.parts:
                return {
                    "content": "I couldn't generate a response. Please try rephrasing your question.",
                    "metadata": None,
                }

            # Separate text parts and function call parts
            text_parts.clear()
            function_calls = []
            for part in candidate.content.parts:
                if part.function_call:
                    function_calls.append(part.function_call)
                elif part.text:
                    text_parts.append(part.text)

            if not function_calls:
                # No more tool calls — we have the final text response
                final_text = "\n".join(text_parts) if text_parts else ""
                break

            # Execute function calls and collect results
            function_response_parts = []
            for fc in function_calls:
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}

                logger.info(f"Agent tool call: {tool_name}({tool_args})")

                # Execute the tool
                tool_result = await self._execute_tool(
                    db, tool_name, tool_args, str(user.id)
                )

                # Track for metadata
                tool_call_log.append(
                    {
                        "tool": tool_name,
                        "args": tool_args,
                        "result_count": len(tool_result)
                        if isinstance(tool_result, list)
                        else 1,
                    }
                )

                # Collect problems from results for UI cards
                if isinstance(tool_result, list):
                    for item in tool_result:
                        if isinstance(item, dict) and "contest_id" in item:
                            collected_problems.append(item)
                elif isinstance(tool_result, dict) and "contest_id" in tool_result:
                    collected_problems.append(tool_result)

                # Build function response part
                function_response_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=tool_name,
                            response={"result": tool_result},
                        )
                    )
                )

            # Add model's response (with function calls) to contents
            contents.append(candidate.content)
            # Add function results to contents
            contents.append(
                types.Content(
                    role="user",
                    parts=function_response_parts,
                )
            )
        else:
            # Hit max iterations
            final_text = (
                "\n".join(text_parts)
                if text_parts
                else (
                    "I ran into some complexity with your request. Here's what I found so far."
                )
            )

        # Deduplicate problems by ID
        seen_ids = set()
        unique_problems = []
        for p in collected_problems:
            pid = p.get("id")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)
                unique_problems.append(p)

        metadata = None
        if unique_problems or tool_call_log:
            metadata = {
                "problems": unique_problems,
                "tool_calls": tool_call_log,
            }

        return {
            "content": final_text,
            "metadata": metadata,
        }

    def _build_contents(self, history: list[dict], new_message: str) -> list:
        """Build the Gemini contents array from conversation history."""
        from google.genai import types

        contents = []

        for msg in history:
            role = msg["role"]
            # Gemini uses "user" and "model" roles
            gemini_role = "model" if role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part(text=msg["content"])],
                )
            )

        # Add the new user message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part(text=new_message)],
            )
        )

        return contents

    async def _execute_tool(
        self,
        db: AsyncSession,
        tool_name: str,
        args: dict[str, Any],
        default_user_id: str,
    ) -> Any:
        """Execute a tool and return the result."""
        from app.services.recommender import recommender

        try:
            if tool_name == "search_problems":
                # Clamp limit
                limit = min(args.get("limit", 10), 20)
                return await recommender.search_problems(
                    db,
                    tags=args.get("tags"),
                    min_rating=args.get("min_rating"),
                    max_rating=args.get("max_rating"),
                    exclude_solved_by=args.get("exclude_solved_by", default_user_id),
                    search_query=args.get("search_query"),
                    sort_by=args.get("sort_by", "educational_score"),
                    limit=limit,
                )

            elif tool_name == "get_problem_details":
                result = await recommender.get_problem_details(
                    db,
                    problem_id=args.get("problem_id"),
                    contest_id=args.get("contest_id"),
                    problem_index=args.get("problem_index"),
                )
                return result or {"error": "Problem not found"}

            elif tool_name == "find_similar_problems":
                return await recommender.find_similar_problems(
                    db,
                    problem_id=args["problem_id"],
                    exclude_solved_by=args.get("exclude_solved_by", default_user_id),
                    limit=min(args.get("limit", 10), 20),
                )

            elif tool_name == "get_user_stats":
                user_id = args.get("user_id", default_user_id)
                return await recommender.get_user_stats_summary(db, user_id)

            elif tool_name == "get_topic_strengths":
                user_id = args.get("user_id", default_user_id)
                return await recommender.get_topic_strengths(db, user_id)

            elif tool_name == "get_solved_history":
                user_id = args.get("user_id", default_user_id)
                return await recommender.get_solved_history(
                    db,
                    user_id,
                    limit=min(args.get("limit", 20), 50),
                    tag_filter=args.get("tag_filter"),
                )

            elif tool_name == "get_available_tags":
                return await recommender.get_available_tags(db)

            else:
                return {"error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            logger.error(f"Tool execution error ({tool_name}): {e}")
            return {"error": f"Tool failed: {str(e)}"}


# Singleton
agent_service = AgentService()
