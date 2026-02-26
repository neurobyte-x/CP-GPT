# CP Path Builder — Architecture Guide

> A structured competitive programming practice platform that transforms
> the Codeforces problem database into guided, progressive learning paths.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Data Model](#data-model)
7. [Core Algorithms](#core-algorithms)
8. [AI Coaching](#ai-coaching)
9. [Codeforces Integration](#codeforces-integration)
10. [Authentication & Authorization](#authentication--authorization)
11. [Background Tasks](#background-tasks)
12. [API Reference](#api-reference)
13. [Deployment](#deployment)
14. [Scalability & Future Work](#scalability--future-work)

---

## System Overview

CP Path Builder is a full-stack web application that helps competitive programmers
improve systematically. Instead of solving random problems, users follow **practice
paths** — curated sequences of problems ordered by difficulty and filtered by topic.

**Data flow at a glance:**

```
┌──────────┐       ┌───────────┐       ┌────────────┐       ┌───────────┐
│ Codeforces│──sync─▶│ PostgreSQL │◀─────▶│  FastAPI    │◀─────▶│  React SPA│
│   API     │       │  (problems,│       │  (backend)  │       │ (frontend)│
└──────────┘       │   users)   │       └──────┬──────┘       └───────────┘
                    └───────────┘              │
                                               ▼
                                        ┌────────────┐
                                        │  OpenAI API │
                                        │  (coaching) │
                                        └────────────┘
```

1. **Periodic sync** pulls problems, tags, and statistics from the Codeforces API.
2. Users authenticate, link their CF handle, and sync their submission history.
3. The **path generator** algorithm selects and orders problems based on topic,
   rating range, practice mode, and the user's solved history.
4. An **AI coaching** layer provides Socratic hints via an OpenAI-compatible LLM.

---

## Technology Stack

| Layer            | Technology                                             |
| ---------------- | ------------------------------------------------------ |
| **Frontend**     | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query, Recharts |
| **Backend**      | FastAPI (Python 3.11+), async SQLAlchemy 2.0, Pydantic v2 |
| **Database**     | PostgreSQL 16 (via asyncpg)                            |
| **Cache**        | Redis 7 (optional, for future use)                     |
| **AI**           | OpenAI-compatible API (gpt-4o-mini default)            |
| **Auth**         | JWT (access + refresh tokens), bcrypt                  |
| **Infrastructure** | Docker Compose, Nginx (frontend proxy)               |
| **Migrations**   | Alembic (async-aware)                                  |

---

## Project Structure

```
.
├── docker-compose.yml          # Full dev stack orchestration
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini             # Alembic config (async driver)
│   ├── .env.example            # All environment variables
│   ├── alembic/
│   │   ├── env.py              # Async-aware migration runner
│   │   ├── script.py.mako      # Migration script template
│   │   └── versions/
│   │       └── 001_initial.py  # Full initial schema
│   └── app/
│       ├── main.py             # App factory + lifespan
│       ├── config.py           # Pydantic Settings (env vars)
│       ├── database.py         # Async engine, session, Base
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── core/               # Security (JWT, bcrypt), exceptions
│       ├── services/           # Business logic layer
│       ├── api/                # FastAPI routers + endpoints
│       └── tasks/              # Background sync + scheduler
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf              # Prod serving + API proxy
│   ├── package.json
│   └── src/
│       ├── App.tsx             # Routing + auth guards
│       ├── types/              # TypeScript interfaces
│       ├── services/           # Axios API client
│       ├── store/              # Zustand auth state
│       ├── hooks/              # React Query hooks
│       ├── components/         # Layout + shared UI
│       └── pages/              # 8 page components
```

---

## Backend Architecture

### Layered Design

```
Endpoints (api/)  →  Services (services/)  →  Models (models/)
     │                     │                       │
     ▼                     ▼                       ▼
  Schemas             Business logic          Database ORM
  + Validation        + Algorithms            + Relationships
```

**Endpoints** handle HTTP concerns (request parsing, response shaping, auth).
**Services** contain all business logic and are stateless singletons.
**Models** define the database schema and ORM relationships.

### Application Factory

`main.py` uses the factory pattern (`create_app()`) for testability:

- **Lifespan API** for startup/shutdown (not deprecated `@on_event`).
- Startup: initialize DB tables (dev only), start background scheduler.
- Shutdown: stop scheduler, close DB connection pool.
- CORS middleware configured from `ALLOWED_ORIGINS` setting.
- Global exception handler returns structured error responses.

### Dependency Injection

`api/deps.py` provides three levels of auth as FastAPI dependencies:

- `get_optional_user()` — Public endpoints; returns `User | None`.
- `get_current_user()` — Authenticated endpoints; raises 401 on failure.
- `require_admin()` — Admin-only; raises 403 if `is_admin` is false.

All dependencies use manual Bearer token extraction from the `Authorization` header.

### Exception Hierarchy

Custom exceptions in `core/exceptions.py` extend `FastAPI.HTTPException`:

- `AppException` (500) — base class.
- `NotFoundException` (404), `ConflictException` (409), `BadRequestException` (400),
  `UnauthorizedException` (401), `ForbiddenException` (403),
  `RateLimitException` (429), `ExternalAPIException` (502).

All accept resource names for clear, semantic error messages.

---

## Frontend Architecture

### State Management

| Concern         | Solution        | Why                                        |
| --------------- | --------------- | ------------------------------------------ |
| Auth state      | Zustand         | Global, synchronous, persisted to localStorage |
| Server state    | React Query     | Caching, background refetch, mutations     |
| Local UI state  | React `useState` | Scoped to components                       |

### Auth Flow

1. On app load, `AuthGuard` calls `loadUser()` which validates the stored token.
2. If valid, the user object is stored in Zustand; if not, tokens are cleared.
3. Protected routes redirect to `/login` when unauthenticated.
4. The Axios interceptor attaches the token to every request and auto-refreshes
   on 401 responses.

### Pages

| Page              | Route              | Description                                     |
| ----------------- | ------------------ | ----------------------------------------------- |
| `LoginPage`       | `/login`           | Email/password login + registration              |
| `DashboardPage`   | `/`                | Stats cards, charts, recent solves, active paths |
| `ProblemsPage`    | `/problems`        | Filterable, paginated problem browser            |
| `PathsPage`       | `/paths`           | Path listing + creation form                     |
| `PathDetailPage`  | `/paths/:id`       | Path progress, problem list, solve/skip workflow |
| `StatsPage`       | `/stats`           | Per-topic stats, charts                          |
| `CoachingPage`    | `/coaching`        | AI coaching interface                            |
| `ProfilePage`     | `/profile`         | User profile + CF handle management              |

### Shared Components

Exported from `components/Layout.tsx`:

`Layout`, `Sidebar`, `Navbar`, `Card`, `StatCard`, `RatingBadge`,
`TagChip`, `ProgressBar`, `Spinner`, `EmptyState`.

---

## Data Model

### Entity-Relationship Diagram

```
┌────────────┐       ┌──────────────┐       ┌──────────┐
│    User     │──1:N──│ PracticePath │──1:N──│PathProblem│
│  (uuid PK)  │       │  (uuid PK)   │       │ (int PK) │
└──────┬─────┘       └──────────────┘       └────┬─────┘
       │                                          │
       │ 1:N                                      │ N:1
       ▼                                          ▼
┌──────────────┐                           ┌───────────┐
│ UserProgress  │──N:1────────────────────▶│  Problem   │
│  (int PK)     │                           │  (int PK)  │
└──────────────┘                           └─────┬─────┘
       │                                          │
       │ 1:N                                      │ M:N
       ▼                                          ▼
┌───────────────┐                           ┌─────────┐
│UserTopicStats  │                           │   Tag    │
│  (int PK)      │──N:1────────────────────▶│ (int PK) │
└───────────────┘                           └─────────┘

┌───────────┐
│ CFSyncLog  │  (audit trail for sync operations)
│  (int PK)  │
└───────────┘
```

### Key Tables

| Table              | PK Type   | Purpose                                    |
| ------------------ | --------- | ------------------------------------------ |
| `users`            | UUID      | User accounts with CF integration fields   |
| `tags`             | Integer   | CF problem topics (name, slug, category)   |
| `problems`         | Integer   | Cached CF problems (unique on contest_id + index) |
| `problem_tags`     | Composite | Many-to-many association                   |
| `practice_paths`   | UUID      | Generated training sequences               |
| `path_problems`    | Integer   | Individual problems within a path          |
| `user_progress`    | Integer   | Per-user per-problem solve tracking        |
| `user_topic_stats` | Integer   | Aggregated per-topic skill estimates       |
| `cf_sync_logs`     | Integer   | Audit trail for CF API sync operations     |

### Enums

- `PathMode`: learning, revision, challenge
- `PathStatus`: active, paused, completed, abandoned
- `ProblemStatus`: locked, unlocked, attempted, solved, skipped
- `AttemptStatus`: attempted, solved, gave_up
- `SyncStatus`: running, success, failed

---

## Core Algorithms

### Path Generation (5-Step Pipeline)

The path generator (`services/path_generator.py`) transforms user parameters into
an ordered sequence of problems:

```
                 topics, rating range, mode, count
                             │
                    ┌────────▼─────────┐
              Step 1│  Fetch Candidates  │  SQLAlchemy query with filters
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
              Step 2│  Partition Bands   │  Group by rating (100-point bands)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
              Step 3│ Calculate Quotas   │  Mode-weighted distribution
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
              Step 4│  Sample Problems   │  Weighted random (educational score)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
              Step 5│  Order & Smooth    │  Progressive difficulty + micro-shuffle
                    └────────┬─────────┘
                             │
                    Generated Path (PracticePath + PathProblems)
```

**Step 3 — Mode-Based Quotas:**

| Mode       | Weight Distribution | Effect                              |
| ---------- | ------------------- | ----------------------------------- |
| Learning   | Decreasing (N, N-1, ..., 1) | More easy problems, steady ramp |
| Revision   | Uniform (1, 1, ..., 1)     | Even spread across all bands    |
| Challenge  | Increasing (1, 2, ..., N)   | More hard problems              |

**Step 4 — Educational Score:**

Problems within each band are ranked by a composite heuristic:

```
score = log2(1 + solved_count) * 10     # Popularity (capped at 50)
      + (20 if rating is not None)       # Has official rating
      + (10 if 2 <= tag_count <= 3)      # "Sweet spot" complexity
```

Higher-scored problems are favored during weighted sampling with 3× oversampling
for variety.

### User Skill Estimation

`services/user_analyzer.py` estimates per-topic skill from solved problem ratings:

```
skill = P75(solved_ratings)              # 75th percentile baseline
      + log2(1 + count) * 15            # Volume bonus
      - std_dev(solved_ratings) * 0.1    # Consistency penalty
```

Clamped to [800, 3500]. Used for dashboard stats and weak-topic identification.

---

## AI Coaching

### Hint Ladder (5 Levels)

The coaching service (`services/coaching.py`) implements a progressive disclosure
model enforced via LLM system prompts:

| Level | Name                | What the LLM provides                        |
| ----- | ------------------- | --------------------------------------------- |
| 1     | Conceptual nudge    | Relevant topic/technique direction             |
| 2     | Approach suggestion | Which algorithm/data structure to consider     |
| 3     | Detailed guidance   | Step-by-step approach outline                  |
| 4     | Near-solution       | Pseudocode or detailed walkthrough             |
| 5     | Full solution       | Complete solution with explanation              |

### Available Actions

- `explain` — Problem statement clarification
- `hint` — Progressive hints at the current level
- `approach` — High-level solution strategies
- `pitfalls` — Common mistakes and edge cases
- `analyze` — Complexity analysis guidance
- `solution` — Full solution (with spoiler warning)

### Safeguards

- The system prompt explicitly instructs the LLM to **coach, not solve**.
- Actions at level 5 or `solution` trigger a spoiler warning.
- `user_context` input is capped at 2,000 characters to limit prompt size.
- The service degrades gracefully when the API key is missing or coaching is disabled.

---

## Codeforces Integration

### Data Sync Pipeline

```
CF API /problemset.problems
          │
          ▼
   Parse problems + statistics
          │
          ▼
   Build solve_count lookup (contestId-index → count)
          │
          ▼
   Upsert tags (INSERT ON CONFLICT UPDATE)
          │
          ▼
   Upsert problems in 500-problem batches
          │
          ▼
   Rebuild problem-tag associations
```

### User Sync Pipeline

```
CF API /user.info + /user.status
          │
          ▼
   Update user profile (max rating)
          │
          ▼
   Process submissions → UserProgress upserts
          │
          ▼
   Recalculate UserTopicStats per tag
```

### Rate Limiting

All CF API calls go through `_rate_limited_get()` which enforces a minimum delay
of `CF_REQUEST_DELAY_SECONDS` (default 2.0s) between consecutive requests.

---

## Authentication & Authorization

### Token Flow

```
Register/Login → access_token (24h) + refresh_token (30d)
                         │
           Every request: Authorization: Bearer <access_token>
                         │
              On 401: POST /auth/refresh with refresh_token
                         │
                 New token pair issued
```

### Implementation Details

- **Password hashing**: bcrypt via passlib.
- **JWT**: PyJWT with HS256, token-type claim (`"access"` vs `"refresh"`) prevents
  misuse (refresh token can't be used as access token).
- **User IDs**: UUIDs stored in JWT `sub` claim.
- **Account deactivation**: `is_active` flag checked during auth validation.
- **Stateless**: No server-side session storage. Logout is client-side token disposal.

---

## Background Tasks

### Scheduler

`tasks/scheduler.py` implements a lightweight asyncio-based periodic task runner:

- Starts/stops with the application lifespan.
- Runs CF problem sync every `CF_SYNC_INTERVAL_HOURS` (default 6h).
- Optional `run_on_start` flag triggers immediate first execution.
- Error handling with 60-second retry delay on failure.
- Designed for development; production should migrate to Celery or ARQ.

### Task Functions

- `sync_codeforces_problems()` — Full problem database sync (creates its own session).
- `sync_user_data(user_id, cf_handle)` — Per-user CF submission sync.

---

## API Reference

All endpoints are under `/api/v1`.

### Auth (`/auth`)

| Method | Path             | Auth | Description           |
| ------ | ---------------- | ---- | --------------------- |
| POST   | `/auth/register` | No   | Create account        |
| POST   | `/auth/login`    | No   | Get tokens            |
| POST   | `/auth/refresh`  | No   | Refresh token pair    |

### Users (`/users`)

| Method | Path                    | Auth    | Description                |
| ------ | ----------------------- | ------- | -------------------------- |
| GET    | `/users/me`             | Yes     | Get profile                |
| PATCH  | `/users/me`             | Yes     | Update profile             |
| POST   | `/users/me/sync-cf`     | Yes     | Trigger CF sync            |
| GET    | `/users/me/dashboard`   | Yes     | Dashboard statistics       |
| GET    | `/users/me/weak-topics` | Yes     | Weakest topics             |

### Problems (`/problems`)

| Method | Path                  | Auth     | Description              |
| ------ | --------------------- | -------- | ------------------------ |
| GET    | `/problems`           | Optional | Browse + filter problems |
| GET    | `/problems/tags`      | No       | All tags with counts     |
| GET    | `/problems/{id}`      | Optional | Single problem detail    |

### Paths (`/paths`)

| Method | Path                          | Auth | Description              |
| ------ | ----------------------------- | ---- | ------------------------ |
| POST   | `/paths`                      | Yes  | Generate new path        |
| GET    | `/paths`                      | Yes  | List user's paths        |
| GET    | `/paths/{id}`                 | Yes  | Path detail + problems   |
| PATCH  | `/paths/{id}`                 | Yes  | Update name/status       |
| DELETE | `/paths/{id}`                 | Yes  | Delete path              |
| POST   | `/paths/{id}/solve`           | Yes  | Mark problem solved      |
| POST   | `/paths/{id}/skip/{position}` | Yes  | Skip problem             |

### Progress (`/progress`)

| Method | Path                 | Auth | Description              |
| ------ | -------------------- | ---- | ------------------------ |
| GET    | `/progress`          | Yes  | Paginated progress list  |
| GET    | `/progress/topics`   | Yes  | Per-topic statistics     |
| GET    | `/progress/summary`  | Yes  | Aggregate summary        |

### Coaching (`/coaching`)

| Method | Path        | Auth | Description              |
| ------ | ----------- | ---- | ------------------------ |
| POST   | `/coaching` | Yes  | Get AI coaching          |

---

## Deployment

### Development (Docker Compose)

```bash
# Start all services
docker compose up --build

# Backend:  http://localhost:8000
# Frontend: http://localhost:3000
# Swagger:  http://localhost:8000/docs
```

The compose stack includes:

- **PostgreSQL 16** on port 5432 with health checks.
- **Redis 7** on port 6379 with health checks.
- **Backend** with hot-reload (volume-mounted source).
- **Frontend** with Nginx serving the built SPA + proxying `/api` to the backend.

### Environment Variables

Copy `backend/.env.example` and fill in production values. Critical variables:

| Variable         | Required | Description                                  |
| ---------------- | -------- | -------------------------------------------- |
| `SECRET_KEY`     | Yes      | JWT signing key (`openssl rand -hex 32`)     |
| `DATABASE_URL`   | Yes      | PostgreSQL async connection string           |
| `OPENAI_API_KEY` | No       | Required for AI coaching features            |
| `CF_API_KEY`     | No       | Optional Codeforces API key for higher limits |

### Database Migrations

```bash
# Generate a new migration after model changes
cd backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## Scalability & Future Work

### Current Limitations (MVP)

- Background scheduler is asyncio-based; not suitable for multi-process deployments.
- Redis is provisioned but not yet used for caching.
- No rate limiting on API endpoints (only on outbound CF API calls).
- No email verification or password reset flow.
- Tests are not yet written.

### Recommended Next Steps

1. **Testing**: Add pytest fixtures with async DB sessions; unit-test the path
   generator algorithm and skill estimation; integration-test the API endpoints.
2. **Redis caching**: Cache problem lists, tag lists, and dashboard stats.
3. **Task queue**: Replace asyncio scheduler with Celery or ARQ for production
   background task processing.
4. **Rate limiting**: Add API rate limiting middleware (e.g., `slowapi`).
5. **Spaced repetition**: Track problem review intervals and suggest re-attempts
   based on forgetting curves.
6. **Social features**: Leaderboards, study groups, shared paths.
7. **Contest simulation**: Timed practice sessions that mimic real CF contests.
8. **Multi-judge support**: Extend beyond Codeforces to AtCoder, CSES, etc.
