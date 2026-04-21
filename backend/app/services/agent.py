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
  - get_topic_explanation: Explain a competitive programming concept/topic
  - review_solution: Review user's solution code for correctness
  - suggest_problem_ladder: Create a difficulty progression for a topic
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



SYSTEM_PROMPT = """\
You are an expert competitive programming coach embedded in the CP Path Builder platform. \
Your job is to help users improve at competitive programming through personalized guidance.

## Your capabilities (via tools):
- Search the local Codeforces problem database by topic tags, difficulty rating, and more
- Look up detailed info on specific problems
- Find problems similar to a given problem
- Analyze the user's solving history, topic strengths, and weaknesses
- List all available topic tags
- **Concept Explainer**: Explain any competitive programming concept or topic in depth
- **Solution Review**: Review a user's code for correctness, edge cases, and improvements
- **Problem Ladder**: Create a difficulty progression for any topic

## Internal reasoning:
Before responding to any request, use a <thought> block to reason through:
- What is the user actually asking for?
- What is their current level and what approach fits best?
- If they're stuck: what is the likely misconception or gap?
- Which tools should I call and why?
The <thought> block is for YOUR internal use only — never show it to the user.

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
8. **Concept Explainer mode**: When a user asks "what is X", "explain X", or "teach me X", \
   use get_topic_explanation to provide a structured explanation with theory, common patterns, \
   key problems, and related topics.

## User context:
- Username: {username}
- Codeforces handle: {cf_handle}
- Estimated rating: {estimated_rating}
- User ID (for tool calls): {user_id}
"""



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
    {
        "name": "get_topic_explanation",
        "description": (
            "Get a structured explanation of a competitive programming concept or topic. "
            "Covers theory, common patterns, complexity analysis, prerequisite knowledge, "
            "and recommended practice problems. Use when user asks 'what is X' or 'explain X'."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "topic": {
                    "type": "STRING",
                    "description": "The topic/concept to explain (e.g., 'segment tree', 'dp on trees', 'binary search')",
                },
                "user_rating": {
                    "type": "INTEGER",
                    "description": "User's estimated rating to tailor explanation depth",
                },
            },
            "required": ["topic"],
        },
    },
    {
        "name": "review_solution",
        "description": (
            "Review a user's solution code for a competitive programming problem. "
            "Analyzes correctness, edge cases, time/space complexity, and suggests improvements. "
            "Use when user pastes code and asks for review."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "code": {
                    "type": "STRING",
                    "description": "The user's solution code to review",
                },
                "problem_id": {
                    "type": "INTEGER",
                    "description": "Internal database ID of the problem (optional, for context)",
                },
                "language": {
                    "type": "STRING",
                    "description": "Programming language (e.g., 'cpp', 'python', 'java')",
                },
            },
            "required": ["code"],
        },
    },
    {
        "name": "suggest_problem_ladder",
        "description": (
            "Create a difficulty ladder (progression) for a given topic. "
            "Returns problems sorted from easy to hard to build up the user's skill gradually."
        ),
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "topic": {
                    "type": "STRING",
                    "description": "The topic tag (e.g., 'dp', 'graphs', 'binary search')",
                },
                "start_rating": {
                    "type": "INTEGER",
                    "description": "Starting difficulty rating (default: user's current rating - 200)",
                },
                "end_rating": {
                    "type": "INTEGER",
                    "description": "Target difficulty rating (default: user's current rating + 300)",
                },
                "exclude_solved_by": {
                    "type": "STRING",
                    "description": "User UUID to exclude already-solved problems",
                },
                "steps": {
                    "type": "INTEGER",
                    "description": "Number of problems in the ladder (default 5)",
                },
            },
            "required": ["topic"],
        },
    },
]

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

        system_prompt = SYSTEM_PROMPT.format(
            username=user.username,
            cf_handle=user.cf_handle or "Not linked",
            estimated_rating=user.estimated_rating or "Unknown",
            user_id=str(user.id),
        )

        contents = self._build_contents(conversation_history, user_message)

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
                        max_output_tokens=settings.LLM_MAX_TOKENS,
                    ),
                )
            except Exception as e:
                logger.error(f"Gemini API error: {e}")
                return {
                    "content": "I'm having trouble connecting to the AI service. Please try again.",
                    "metadata": None,
                }

            candidate = response.candidates[0] if response.candidates else None
            if not candidate or not candidate.content or not candidate.content.parts:
                return {
                    "content": "I couldn't generate a response. Please try rephrasing your question.",
                    "metadata": None,
                }

            text_parts.clear()
            function_calls = []
            for part in candidate.content.parts:
                if part.function_call:
                    function_calls.append(part.function_call)
                elif part.text:
                    text_parts.append(part.text)

            if not function_calls:
                final_text = "\n".join(text_parts) if text_parts else ""
                break

            function_response_parts = []
            for fc in function_calls:
                tool_name = fc.name
                tool_args = dict(fc.args) if fc.args else {}

                logger.info(f"Agent tool call: {tool_name}({tool_args})")

                tool_result = await self._execute_tool(
                    db, tool_name, tool_args, str(user.id)
                )

                tool_call_log.append(
                    {
                        "tool": tool_name,
                        "args": tool_args,
                        "result_count": len(tool_result)
                        if isinstance(tool_result, list)
                        else 1,
                    }
                )

                if isinstance(tool_result, list):
                    for item in tool_result:
                        if isinstance(item, dict) and "contest_id" in item:
                            collected_problems.append(item)
                elif isinstance(tool_result, dict) and "contest_id" in tool_result:
                    collected_problems.append(tool_result)

                function_response_parts.append(
                    types.Part(
                        function_response=types.FunctionResponse(
                            name=tool_name,
                            response={"result": tool_result},
                        )
                    )
                )

            contents.append(candidate.content)
            contents.append(
                types.Content(
                    role="user",
                    parts=function_response_parts,
                )
            )
        else:
            final_text = (
                "\n".join(text_parts)
                if text_parts
                else (
                    "I ran into some complexity with your request. Here's what I found so far."
                )
            )

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
        """Build the Gemini contents array from conversation history.
        
        Applies a sliding window (max 10 messages) to avoid token limit issues.
        """
        from google.genai import types

        contents = []

        windowed_history = history[-10:] if len(history) > 10 else history

        for msg in windowed_history:
            role = msg["role"]
            gemini_role = "model" if role == "assistant" else "user"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part(text=msg["content"])],
                )
            )

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

            elif tool_name == "get_topic_explanation":
                topic = args.get("topic", "")
                user_rating = args.get("user_rating", 1200)
                return {
                    "topic": topic,
                    "explanation": self._build_topic_explanation(topic, user_rating),
                }

            elif tool_name == "review_solution":
                code = args.get("code", "")
                language = args.get("language", "auto")
                problem_id = args.get("problem_id")
                context = {}
                if problem_id:
                    details = await recommender.get_problem_details(db, problem_id=problem_id)
                    if details:
                        context = details
                return {
                    "code": code,
                    "language": language,
                    "problem_context": context,
                    "instruction": (
                        "Review this code for: 1) Correctness (edge cases, off-by-one errors), "
                        "2) Time/space complexity analysis, 3) Code style improvements, "
                        "4) Potential runtime errors (overflow, TLE, MLE). "
                        "Be specific and constructive."
                    ),
                }

            elif tool_name == "suggest_problem_ladder":
                topic = args.get("topic", "dp")
                start_rating = args.get("start_rating", 800)
                end_rating = args.get("end_rating", 1800)
                steps = min(args.get("steps", 5), 10)
                
                rating_step = max(1, (end_rating - start_rating) // steps)
                ladder = []
                for i in range(steps):
                    r_min = start_rating + (i * rating_step)
                    r_max = r_min + rating_step
                    problems = await recommender.search_problems(
                        db,
                        tags=[topic],
                        min_rating=r_min,
                        max_rating=r_max,
                        exclude_solved_by=args.get("exclude_solved_by", default_user_id),
                        sort_by="educational_score",
                        limit=1,
                    )
                    if problems:
                        ladder.append({
                            "step": i + 1,
                            "rating_range": f"{r_min}-{r_max}",
                            "problem": problems[0],
                        })
                return ladder

            else:
                return {"error": f"Unknown tool: {tool_name}"}

        except Exception as e:
            logger.error(f"Tool execution error ({tool_name}): {e}")
            return {"error": f"Tool failed: {str(e)}"}

    @staticmethod
    def _build_topic_explanation(topic: str, user_rating: int) -> dict:
        """Build a structured topic explanation."""
        TOPIC_DATA = {
            "dp": {
                "full_name": "Dynamic Programming",
                "prerequisites": ["Recursion", "Memoization", "Greedy (to understand when DP is needed)"],
                "key_patterns": [
                    "1D DP (Fibonacci-like)",
                    "Knapsack variants (0/1, unbounded, bounded)",
                    "Grid DP (path counting, min-cost)",
                    "Interval DP",
                    "Bitmask DP",
                    "DP on trees",
                    "Digit DP",
                ],
                "complexity_note": "Usually O(n*states) time, O(states) space with rolling array optimization",
                "beginner_tip": "Start by writing the recurrence relation. Then implement top-down with memoization before converting to bottom-up.",
            },
            "graphs": {
                "full_name": "Graph Algorithms",
                "prerequisites": ["Arrays", "Recursion(DFS)", "Queues(BFS)"],
                "key_patterns": [
                    "BFS/DFS traversal",
                    "Shortest paths (Dijkstra, Bellman-Ford, Floyd-Warshall)",
                    "Minimum spanning tree (Kruskal, Prim)",
                    "Topological sort",
                    "Strongly connected components (Tarjan, Kosaraju)",
                    "Bipartite checking",
                ],
                "complexity_note": "BFS/DFS: O(V+E). Dijkstra: O((V+E)logV). Floyd-Warshall: O(V^3)",
                "beginner_tip": "Master BFS and DFS first. Most graph problems reduce to one of these.",
            },
            "binary search": {
                "full_name": "Binary Search",
                "prerequisites": ["Sorting", "Monotonic functions"],
                "key_patterns": [
                    "Search on sorted array",
                    "Binary search on answer (parametric search)",
                    "Lower/upper bound",
                    "Ternary search for unimodal functions",
                ],
                "complexity_note": "O(log n) per search, O(n log n) when combined with sorting",
                "beginner_tip": "The key insight: if you can verify a candidate answer in O(n), you can often binary search on the answer space.",
            },
            "greedy": {
                "full_name": "Greedy Algorithms",
                "prerequisites": ["Sorting", "Basic proof techniques"],
                "key_patterns": [
                    "Activity selection / interval scheduling",
                    "Huffman coding",
                    "Exchange arguments",
                    "Sorting-based greedy",
                ],
                "complexity_note": "Usually O(n log n) due to sorting",
                "beginner_tip": "If you think a greedy works, try to prove it or find a counter-example. Many DP problems look greedy but aren't.",
            },
            "data structures": {
                "full_name": "Data Structures",
                "prerequisites": ["Arrays", "Pointers/references", "Recursion"],
                "key_patterns": [
                    "Segment trees (point/range updates, lazy propagation)",
                    "Fenwick trees (Binary Indexed Trees)",
                    "Disjoint Set Union (DSU)",
                    "Sparse tables (RMQ)",
                    "Balanced BSTs (policy-based in C++)",
                ],
                "complexity_note": "Segment tree: O(log n) per query/update. DSU: nearly O(1) amortized.",
                "beginner_tip": "Start with DSU and BIT — they cover most competitive programming needs. Add segment trees when you're comfortable.",
            },
        }

        topic_lower = topic.lower().strip()
        data = TOPIC_DATA.get(topic_lower, None)
        
        if data:
            return {
                "topic": data["full_name"],
                "prerequisites": data["prerequisites"],
                "key_patterns": data["key_patterns"],
                "complexity_note": data["complexity_note"],
                "beginner_tip": data["beginner_tip"],
                "user_level": "beginner" if user_rating < 1200 else "intermediate" if user_rating < 1800 else "advanced",
            }
        else:
            return {
                "topic": topic,
                "note": f"Generate a comprehensive explanation of '{topic}' in competitive programming context.",
                "include": ["prerequisites", "key patterns", "complexity analysis", "practice recommendations"],
                "user_level": "beginner" if user_rating < 1200 else "intermediate" if user_rating < 1800 else "advanced",
            }


agent_service = AgentService()
