// ── Core domain types matching backend schemas ──────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  cf_handle: string | null;
  estimated_rating: number | null;
  cf_max_rating: number | null;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  category: string | null;
  problem_count: number;
}

export interface Problem {
  id: number;
  contest_id: number;
  problem_index: string;
  name: string;
  rating: number | null;
  solved_count: number;
  url: string;
  tags: Tag[];
  contest_name: string | null;
  contest_type: string | null;
  created_at: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PathProblem {
  id: number;
  position: number;
  status: 'locked' | 'unlocked' | 'attempted' | 'solved' | 'skipped';
  problem: Problem;
  unlocked_at: string | null;
  solved_at: string | null;
}

export interface PracticePath {
  id: string;
  name: string;
  description: string | null;
  topics: string[];
  min_rating: number;
  max_rating: number;
  mode: 'learning' | 'revision' | 'challenge';
  forced_mode: boolean;
  current_position: number;
  total_problems: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  progress_pct: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface PathDetail extends PracticePath {
  problems: PathProblem[];
}

export interface TopicStats {
  tag_name: string;
  tag_slug: string;
  problems_solved: number;
  problems_attempted: number;
  avg_rating_solved: number;
  max_rating_solved: number;
  estimated_skill: number;
}

export interface DashboardStats {
  total_problems_solved: number;
  total_problems_attempted: number;
  total_time_spent_hours: number;
  active_paths: number;
  completed_paths: number;
  current_streak_days: number;
  estimated_rating: number | null;
  topic_stats: TopicStats[];
  recent_solves: UserProgress[];
  rating_distribution: Record<string, number>;
}

export interface UserProgress {
  id: number;
  problem_id: number;
  status: 'attempted' | 'solved' | 'gave_up';
  attempts: number;
  time_spent_seconds: number;
  hints_used: number;
  cf_verdict: string | null;
  first_attempted_at: string;
  solved_at: string | null;
}

export interface CoachingRequest {
  problem_id: number;
  action: 'explain' | 'hint' | 'approach' | 'pitfalls' | 'analyze' | 'solution';
  hint_level: number;
  user_context?: string;
}

export interface CoachingResponse {
  problem_id: number;
  action: string;
  response: string;
  hint_level: number | null;
  follow_up_suggestions: string[];
  warning: string | null;
}

// ── Request types ───────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  cf_handle?: string;
}

/** FastAPI-Users returns only access_token (no refresh token) */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface CreatePathRequest {
  name: string;
  topics: string[];
  min_rating: number;
  max_rating: number;
  mode: 'learning' | 'revision' | 'challenge';
  forced_mode: boolean;
  problem_count: number;
}

export interface ProblemFilters {
  tags?: string;
  min_rating?: number;
  max_rating?: number;
  search?: string;
  exclude_solved?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: 'rating' | 'solved_count' | 'contest_id' | 'name';
  sort_order?: 'asc' | 'desc';
}

// ── Utility types ───────────────────────────────────────────────

export function getRatingColor(rating: number | null): string {
  if (rating === null) return 'text-gray-500';
  if (rating < 1200) return 'text-gray-500';
  if (rating < 1400) return 'text-green-600';
  if (rating < 1600) return 'text-cyan-600';
  if (rating < 1900) return 'text-blue-600';
  if (rating < 2100) return 'text-purple-600';
  if (rating < 2300) return 'text-orange-500';
  if (rating < 2400) return 'text-orange-500';
  if (rating < 2600) return 'text-red-600';
  return 'text-red-700';
}

export function getRatingBadgeColor(rating: number | null): string {
  if (rating === null) return 'bg-gray-100 text-gray-600';
  if (rating < 1200) return 'bg-gray-100 text-gray-700';
  if (rating < 1400) return 'bg-green-100 text-green-700';
  if (rating < 1600) return 'bg-cyan-100 text-cyan-700';
  if (rating < 1900) return 'bg-blue-100 text-blue-700';
  if (rating < 2100) return 'bg-purple-100 text-purple-700';
  if (rating < 2400) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}
