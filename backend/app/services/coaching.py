"""
AI Coaching service.

Implements graded hint ladder and coaching capabilities.
The AI acts as a coach — it helps users think, not solve.

Hint ladder levels:
  1. Conceptual nudge     — "Think about what data structure fits here"
  2. Approach direction    — "Consider a greedy approach based on sorting"
  3. Key insight           — "The key observation is that the array is monotonic after..."
  4. Detailed walkthrough  — Step-by-step reasoning without code
  5. Full solution         — Code + explanation (only on explicit request)

Integration:
  Uses Google Gemini (google-genai SDK) for LLM inference.
  Prompts are designed to prevent premature solution revelation.
"""

import logging
from typing import Optional

from app.config import get_settings
from app.models.problem import Problem

logger = logging.getLogger(__name__)
settings = get_settings()

# ── Prompt Templates ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert competitive programming coach. Your role is to help \
students LEARN, not to solve problems for them.

Rules:
1. Never provide a full solution unless the student explicitly asks for one AND the hint_level is 5.
2. Use the Socratic method — ask guiding questions when possible.
3. Be concise but precise. Competitive programmers value brevity.
4. Reference specific algorithmic concepts and complexity analysis where relevant.
5. If the problem involves well-known techniques, name them so the student can study further.
6. Always encourage the student after providing help.

The current hint level is {hint_level}/5:
- Level 1: Give only a vague conceptual nudge. Do NOT reveal the approach.
- Level 2: Suggest a general direction (e.g., "think about greedy" or "this is a graph problem").
- Level 3: Reveal the key insight or observation needed to solve the problem.
- Level 4: Provide a detailed step-by-step reasoning walkthrough, but NO code.
- Level 5: Provide the full solution with code and explanation.
"""

ACTION_PROMPTS = {
    "explain": """Explain the following competitive programming problem in clear, simple terms.
Focus on:
- What the problem is asking
- Input/output format
- Key constraints and what they imply about expected complexity
- Any edge cases to watch out for

Problem: {problem_name}
Contest: {contest_id}{problem_index}
Rating: {rating}
Tags: {tags}
URL: {url}

{user_context}""",
    "hint": """The student is stuck on this problem and needs a hint at level {hint_level}/5.

Problem: {problem_name}
Contest: {contest_id}{problem_index}
Rating: {rating}
Tags: {tags}

Student's context: {user_context}

Provide a hint appropriate to level {hint_level}. Remember the hint ladder rules.""",
    "approach": """Suggest possible approaches for this problem. Do NOT give the solution.
List 2-3 potential approaches with brief descriptions of how they might apply.

Problem: {problem_name}
Contest: {contest_id}{problem_index}
Rating: {rating}
Tags: {tags}

Student's context: {user_context}""",
    "pitfalls": """What are common mistakes and pitfalls for this type of problem?

Problem: {problem_name}
Contest: {contest_id}{problem_index}
Rating: {rating}
Tags: {tags}

Mention:
- Common off-by-one errors
- Edge cases often missed
- Complexity traps
- Implementation pitfalls""",
    "analyze": """The student has solved this problem and wants post-solve analysis.

Problem: {problem_name}
Contest: {contest_id}{problem_index}
Rating: {rating}
Tags: {tags}

Provide:
- What the optimal approach is and why it works
- Time and space complexity analysis
- Related problems or techniques to study
- How this problem fits into broader algorithmic patterns

Student's notes: {user_context}""",
    "solution": """Provide a complete solution for this problem with detailed explanation.

Problem: {problem_name}
Contest: {contest_id}{problem_index}
Rating: {rating}
Tags: {tags}

Include:
- Problem analysis
- Approach explanation
- Clean, well-commented code (C++ or Python)
- Complexity analysis

Student's context: {user_context}""",
}


class CoachingService:
    """AI-powered coaching for competitive programming problems."""

    def __init__(self):
        self._client = None

    async def _get_client(self):
        """Lazy-initialize the Google GenAI client."""
        if self._client is None:
            try:
                from google import genai

                self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except ImportError:
                logger.error("google-genai package not installed")
                raise RuntimeError("AI coaching requires the 'google-genai' package")
        return self._client

    async def get_coaching(
        self,
        problem: Problem,
        action: str,
        hint_level: int = 1,
        user_context: str = "",
    ) -> dict:
        """
        Get AI coaching response for a problem.

        Returns dict with:
          - response: The coaching text
          - warning: Optional warning about spoiler level
          - follow_up_suggestions: Suggested next actions
        """
        if not settings.COACHING_ENABLED:
            return {
                "response": "AI coaching is currently disabled.",
                "warning": None,
                "follow_up_suggestions": [],
            }

        if not settings.GEMINI_API_KEY:
            return {
                "response": "AI coaching requires a Gemini API key to be configured.",
                "warning": None,
                "follow_up_suggestions": [],
            }

        # Validate action
        if action not in ACTION_PROMPTS:
            return {
                "response": f"Unknown action: {action}",
                "warning": None,
                "follow_up_suggestions": [],
            }

        # Build prompts
        system_prompt = SYSTEM_PROMPT.format(hint_level=hint_level)
        tags_str = ", ".join(t.name for t in problem.tags) if problem.tags else "N/A"

        user_prompt = ACTION_PROMPTS[action].format(
            problem_name=problem.name,
            contest_id=problem.contest_id,
            problem_index=problem.problem_index,
            rating=problem.rating or "Unrated",
            tags=tags_str,
            url=problem.url,
            hint_level=hint_level,
            user_context=user_context or "No additional context provided.",
        )

        # Safety: warn about high hint levels
        warning = None
        if action == "solution":
            warning = "Full solution provided. Make sure you've tried solving it yourself first!"
        elif action == "hint" and hint_level >= 4:
            warning = (
                "This hint reveals significant detail about the solution approach."
            )
        elif action == "analyze":
            warning = "Post-solve analysis may reveal the intended approach."

        try:
            from google.genai import types

            client = await self._get_client()
            response = await client.aio.models.generate_content(
                model=settings.LLM_MODEL,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=settings.LLM_MAX_TOKENS,
                    temperature=settings.LLM_TEMPERATURE,
                ),
            )
            content = response.text or ""
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            content = (
                "I'm having trouble connecting to the AI service right now. "
                "Please try again later."
            )

        # Generate follow-up suggestions
        follow_ups = self._get_follow_up_suggestions(action, hint_level)

        return {
            "response": content,
            "warning": warning,
            "follow_up_suggestions": follow_ups,
        }

    def _get_follow_up_suggestions(self, action: str, hint_level: int) -> list[str]:
        """Suggest next coaching actions based on current action."""
        suggestions = []

        if action == "explain":
            suggestions = [
                "Try solving it now",
                "Get a hint (level 1)",
                "See possible approaches",
            ]
        elif action == "hint":
            if hint_level < 5:
                suggestions.append(f"Get a stronger hint (level {hint_level + 1})")
            suggestions.append("Check common pitfalls")
            suggestions.append("Try implementing your idea")
        elif action == "approach":
            suggestions = [
                "Get a hint to narrow down",
                "Check common pitfalls",
                "Try implementing",
            ]
        elif action == "pitfalls":
            suggestions = [
                "Try solving it now",
                "Get a hint if still stuck",
            ]
        elif action == "analyze":
            suggestions = [
                "Move to the next problem",
                "Try a similar problem at higher difficulty",
            ]
        elif action == "solution":
            suggestions = [
                "Implement it yourself without looking at the code",
                "Move to the next problem",
            ]

        return suggestions


# Singleton
coaching_service = CoachingService()
