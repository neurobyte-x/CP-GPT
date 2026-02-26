-- =============================================================================
-- CP Path Builder — Full Schema for Neon DB
-- Generated from: backend/alembic/versions/001_initial.py
-- Paste this into Neon's SQL Editor to create all tables.
-- =============================================================================

-- ── Custom ENUM Types ───────────────────────────────────────────────────────

CREATE TYPE pathmode AS ENUM ('learning', 'revision', 'challenge');
CREATE TYPE pathstatus AS ENUM ('active', 'paused', 'completed', 'abandoned');
CREATE TYPE problemstatus AS ENUM ('locked', 'unlocked', 'attempted', 'solved', 'skipped');
CREATE TYPE attemptstatus AS ENUM ('attempted', 'solved', 'gave_up');
CREATE TYPE syncstatus AS ENUM ('running', 'success', 'failed');


-- ── Extension: uuid-ossp (for gen_random_uuid if needed) ────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── users ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    cf_handle VARCHAR(100),
    estimated_rating INTEGER,
    cf_max_rating INTEGER,
    cf_last_synced TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE UNIQUE INDEX ix_users_cf_handle ON users (cf_handle);


-- ── tags ────────────────────────────────────────────────────────────────────

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    category VARCHAR(50)
);

CREATE UNIQUE INDEX ix_tags_name ON tags (name);
CREATE UNIQUE INDEX ix_tags_slug ON tags (slug);


-- ── problems ────────────────────────────────────────────────────────────────

CREATE TABLE problems (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL,
    problem_index VARCHAR(5) NOT NULL,
    name VARCHAR(500) NOT NULL,
    rating INTEGER,
    solved_count INTEGER DEFAULT 0,
    contest_name VARCHAR(500),
    contest_type VARCHAR(20),
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_problem_contest_index UNIQUE (contest_id, problem_index)
);

CREATE INDEX ix_problems_contest_id ON problems (contest_id);
CREATE INDEX ix_problems_rating ON problems (rating);
CREATE INDEX ix_problems_solved_count ON problems (solved_count);


-- ── problem_tags (many-to-many) ─────────────────────────────────────────────

CREATE TABLE problem_tags (
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (problem_id, tag_id)
);


-- ── practice_paths ──────────────────────────────────────────────────────────

CREATE TABLE practice_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    topics VARCHAR[] NOT NULL,
    min_rating INTEGER NOT NULL,
    max_rating INTEGER NOT NULL,
    mode pathmode NOT NULL DEFAULT 'learning',
    forced_mode BOOLEAN DEFAULT false,
    current_position INTEGER DEFAULT 0,
    total_problems INTEGER DEFAULT 0,
    status pathstatus NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX ix_practice_paths_user_id ON practice_paths (user_id);


-- ── path_problems ───────────────────────────────────────────────────────────

CREATE TABLE path_problems (
    id SERIAL PRIMARY KEY,
    path_id UUID NOT NULL REFERENCES practice_paths(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    status problemstatus NOT NULL DEFAULT 'locked',
    unlocked_at TIMESTAMPTZ,
    solved_at TIMESTAMPTZ
);

CREATE INDEX ix_path_problems_path_id ON path_problems (path_id);


-- ── user_progress ───────────────────────────────────────────────────────────

CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    status attemptstatus NOT NULL DEFAULT 'attempted',
    attempts INTEGER DEFAULT 1,
    time_spent_seconds INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    cf_verdict VARCHAR(50),
    first_attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    solved_at TIMESTAMPTZ
);

CREATE INDEX ix_user_progress_user_id ON user_progress (user_id);
CREATE INDEX ix_user_progress_problem_id ON user_progress (problem_id);


-- ── user_topic_stats ────────────────────────────────────────────────────────

CREATE TABLE user_topic_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    problems_solved INTEGER DEFAULT 0,
    problems_attempted INTEGER DEFAULT 0,
    avg_rating_solved DOUBLE PRECISION DEFAULT 0.0,
    max_rating_solved INTEGER DEFAULT 0,
    estimated_skill INTEGER DEFAULT 800,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_user_topic_stats_user_id ON user_topic_stats (user_id);


-- ── cf_sync_logs ────────────────────────────────────────────────────────────

CREATE TABLE cf_sync_logs (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL,
    status syncstatus NOT NULL DEFAULT 'running',
    problems_synced INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);


-- ── Alembic version tracking ────────────────────────────────────────────────
-- This table lets Alembic know the schema is at revision 001_initial

CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

INSERT INTO alembic_version (version_num) VALUES ('001_initial');
