# CP-GPT — Improvement Suggestions

## 🎯 For CP Beginners & Intermediate Grinders

### 1. Concept Explainer Mode (High Priority)
Currently the AI coach helps find problems, but it doesn't actively teach concepts.

- Add a dedicated **"Learn a Topic"** flow where the coach gives a structured lesson: concept → intuition → example → beginner problem → medium problem
- Add `get_topic_explanation` tool to the agent so the LLM can return a formatted lesson card, not just a chat message
- Pair it with a **"Concept Roadmap"** — ordered list of topics to learn before tackling DP, Graph Theory, etc.

### 2. Difficulty Ramp (Problem Ladder)
The current recommender returns problems in a flat list. Build a **ladder** instead:

- For a chosen topic (e.g. Binary Search), auto-generate a 5–10 problem ladder: 800 → 1000 → 1200 → 1400 → 1600+
- Lock subsequent rungs until the previous is solved
- Display progress visually on `PathDetailPage`

### 3. "I'm Stuck" Emergency Button
Inside `ProblemWorkspacePage`, add a dedicated **"I'm Stuck"** CTA that:

1. Auto-detects which problem is open (already in workspace context)
2. Fires a prefilled coach message: `"I'm stuck on [problem name], give me a level-1 hint"`
3. The agent already has a 5-level hint ladder in its system prompt — surface it directly in the UI

### 4. Daily Practice Mode
Beginners need routine. Add a **Daily Challenge**:

- Each day generate 3 problems tuned to the user's estimated rating (one easy, one on-target, one stretch)
- Track daily streaks (the `current_streak_days` field already exists in the backend)
- Show a calendar heatmap on the Dashboard (like GitHub contributions) using solved dates from `UserProgress`

### 5. Solution Review / Code Analysis
After a user marks a problem as solved:

- Let them paste their code and ask the coach: `"Review my solution for [problem]"`
- The agent can comment on time/space complexity, identify antipatterns, and suggest a cleaner approach
- Add a `review_solution` tool to `TOOL_DECLARATIONS` in [agent.py](file:///d:/Cp-GPT/backend/app/services/agent.py)

### 6. "Am I Ready?" Rating Estimator
Users don't always know if they're ready to level up. Add a quiz/estimator:

- Pull 5 unseen problems near the user's estimated rating
- User self-reports: "Solved easily" / "Solved with hints" / "Couldn't solve"
- Re-estimate their rating using these results and update `estimated_rating` in the DB

### 7. Topic Prerequisite Graph
Show beginners WHAT to learn before what:

- Add a static prerequisite map (e.g. Recursion → Backtracking → DP)
- Highlight on the analytics page which prerequisites the user hasn't mastered yet

---

## 📈 For Scalability

### 8. API Rate Limiting & Caching
- The `/admin/sync-problems` endpoint has no auth guard — add proper admin token or JWT role check
- Add **Redis caching** for [search_problems](file:///d:/Cp-GPT/backend/app/services/recommender.py#34-101) and [get_available_tags](file:///d:/Cp-GPT/backend/app/services/recommender.py#328-332) queries (these are called on every agent tool invocation)
- Add `slowapi` rate limiting on `/api/v1/chat` to prevent AI cost explosions

### 9. Conversation Persistence & Token Management
Currently the full conversation history is sent to Gemini on every message (in [_build_contents](file:///d:/Cp-GPT/backend/app/services/agent.py#427-451)). This is expensive and will hit token limits:

- Store conversations in the DB (a `ChatSession` + `ChatMessage` model)
- Implement sliding window: only send the last N messages + a compressed summary of earlier context
- This also allows users to revisit old coach sessions

### 10. Background Job Hardening
The Codeforces sync scheduler runs as a background task with no dead-letter queue:

- Add a `SyncLog` model to track each sync run (status, problems added/updated, errors)
- Expose sync history on an admin dashboard
- Add retry logic with exponential backoff for failed API calls in `cf_sync.py`

### 11. Database Indexing
The recommender does complex filtered queries on `Problem.tags`, `Problem.rating`, `UserProgress.status`. Make sure composite indexes exist:

```sql
CREATE INDEX IF NOT EXISTS idx_problem_rating ON problems(rating);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_status ON user_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_problem_tags_tag_id ON problem_tags(tag_id);
```

Add these to your Alembic migrations.

### 12. Horizontal Scaling Readiness
- The scheduler in `scheduler.py` will run on every worker instance if you scale Render to multiple instances — make it **leader-elected** (use Postgres advisory locks or a `SKIP LOCKED` queue)
- Move the [AgentService](file:///d:/Cp-GPT/backend/app/services/agent.py#242-519) client init to a singleton with connection pooling

### 13. Observability
- Add **Sentry** for error tracking (the global exception handler in [main.py](file:///d:/Cp-GPT/backend/app/main.py) only logs, doesn't alert)
- Add structured JSON logging in production (`python-json-logger`) for easy ingestion into Datadog/Grafana
- Add a `/metrics` endpoint with Prometheus metrics (request count, latency, DB pool usage)

---

## 🚀 User-Attraction Features

### 14. Leaderboard & Social Layer
Nothing motivates competitive programmers like competition:

- **Weekly leaderboard** — top users by problems solved / rating gained this week
- **Friend system** — follow a Codeforces handle and get notified when a friend solves a problem you haven't
- **"Beat your friend"** recommendations — show problems your friend solved but you haven't

### 15. Public Profile & Share Card
- Make user profiles public (opt-in) with a shareable URL: `/u/[username]`
- Generate a **dynamic share card** (OG image) showing: rating, problems solved, weak/strong topics
- Users can share on Twitter/LinkedIn — free viral marketing

### 16. Personalized Weekly Digest Email
- Every Monday, email users: "Your week in review"
  - Problems solved, streak status, topic progress
  - 3 recommended problems for next week based on their weak spots
- Use `resend.com` or `SendGrid` — both have free tiers

### 17. Onboarding Flow Enhancement
New users currently land cold with no guidance:

- Add a **3-step onboarding wizard** after registration:
  1. Enter Codeforces handle → instant sync
  2. Rate familiarity with 5 key topics (slider: Novice → Expert)
  3. Set a weekly goal (e.g. "5 problems/week")
- Use this to seed their first training path immediately

### 18. Problem Discussion / Notes
- Let users add **private notes** to any problem (thought process, key insight)
- Optionally make notes public — crowd-sourced hints system
- This creates content that keeps users returning

### 19. Contest Mode
- Sync upcoming Codeforces contests from the API
- Let users **register intent** to participate
- After a contest, auto-sync their results and identify which problems stumped them → auto-generate a post-contest training path

### 20. Achievement Badges
Gamification keeps beginners engaged:

| Badge | Trigger |
|---|---|
| 🔥 Streak Master | 7-day solve streak |
| 🧠 DP Initiate | Solve 10 DP problems |
| 📈 Rating Climber | Estimated rating +100 |
| ⚔️ Contest Warrior | Participate in 3 contests |

Display on profile and Dashboard.

---

## 🛑 Quick Wins (Low Effort, High Impact)

| Fix | Where |
|---|---|
| Show problem **name** in Recent Activity (not just `#id`) | [DashboardPage.tsx](file:///d:/Cp-GPT/frontend/src/pages/DashboardPage.tsx) line 314 |
| Add `/admin/sync-problems` auth guard | [main.py](file:///d:/Cp-GPT/backend/app/main.py) line 98 |
| Keyboard shortcut `Ctrl+K` to open AI coach | [AppLayout.tsx](file:///d:/Cp-GPT/frontend/src/components/AppLayout.tsx) |
| Add a "Copy problem URL" button to problem cards | [ProblemCard.tsx](file:///d:/Cp-GPT/frontend/src/components/ProblemCard.tsx) |
| Show estimated CF rating tier color (Pupil/Specialist/Expert) | [DashboardPage.tsx](file:///d:/Cp-GPT/frontend/src/pages/DashboardPage.tsx) |
