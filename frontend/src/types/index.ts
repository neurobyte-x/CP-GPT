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
  recent_solves: RecentSolve[];
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

export interface RecentSolve extends UserProgress {
  problem_name: string;
  contest_id: number | null;
  problem_index: string | null;
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

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata_: {
    problems?: ChatProblem[];
    tool_calls?: { tool: string; args: Record<string, unknown>; result_count: number }[];
  } | null;
  created_at: string;
}

export interface ChatProblem {
  id: number;
  contest_id: number;
  problem_index: string;
  name: string;
  rating: number | null;
  solved_count: number;
  tags: string[];
  url: string;
  contest_name: string | null;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

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

export function getRatingTier(rating: number | null): string {
  if (rating === null) return 'Unrated';
  if (rating < 1200) return 'Newbie';
  if (rating < 1400) return 'Pupil';
  if (rating < 1600) return 'Specialist';
  if (rating < 1900) return 'Expert';
  if (rating < 2100) return 'Candidate Master';
  if (rating < 2300) return 'Master';
  if (rating < 2400) return 'International Master';
  if (rating < 2600) return 'Grandmaster';
  if (rating < 3000) return 'International Grandmaster';
  return 'Legendary Grandmaster';
}

export function getRatingTierColor(rating: number | null): string {
  if (rating === null) return '#6b7280';
  if (rating < 1200) return '#9ca3af';
  if (rating < 1400) return '#22c55e';
  if (rating < 1600) return '#06b6d4';
  if (rating < 1900) return '#3b82f6';
  if (rating < 2100) return '#a855f7';
  if (rating < 2300) return '#f97316';
  if (rating < 2400) return '#f97316';
  if (rating < 2600) return '#ef4444';
  if (rating < 3000) return '#dc2626';
  return '#b91c1c';
}
