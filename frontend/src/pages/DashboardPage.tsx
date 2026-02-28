/**
 * Dashboard page — dark theme, wired to real backend data.
 * Visual design from UI reference, data from useDashboard + usePaths hooks.
 */

import { useNavigate, Link } from 'react-router-dom';
import {
  Brain,
  Target,
  Flame,
  Trophy,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Send,
  Code2,
  BarChart3,
  BookOpen,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';

import { useDashboard, usePaths, useSyncCF } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import type { DashboardStats, TopicStats, UserProgress } from '@/types';

// ── Helpers ─────────────────────────────────────────────────────

function ratingColor(r: number | null): string {
  if (r === null) return 'text-gray-400';
  if (r < 1200) return 'text-gray-400';
  if (r < 1400) return 'text-green-400';
  if (r < 1600) return 'text-cyan-400';
  if (r < 1900) return 'text-blue-400';
  if (r < 2100) return 'text-purple-400';
  return 'text-red-400';
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 100) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

const statusColors: Record<string, string> = {
  solved: 'text-neon-green',
  attempted: 'text-neon-orange',
  gave_up: 'text-muted-foreground',
};

const statusIcons: Record<string, typeof CheckCircle2> = {
  solved: CheckCircle2,
  attempted: Clock,
  gave_up: AlertTriangle,
};

// ── Loading skeleton ────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto animate-pulse">
      <div className="h-10 w-72 bg-secondary rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 h-28" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-xl h-40" />
          <div className="bg-card border border-border rounded-xl h-24" />
          <div className="bg-card border border-border rounded-xl h-64" />
        </div>
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl h-28" />
          <div className="bg-card border border-border rounded-xl h-48" />
          <div className="bg-card border border-border rounded-xl h-56" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────

function DashboardEmpty({ onSync, syncing }: { onSync: () => void; syncing: boolean }) {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <BarChart3 className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No data yet</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md">
          Start solving problems or sync your Codeforces account to see your dashboard stats.
        </p>
        <button
          onClick={onSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Codeforces'}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: activePaths } = usePaths('active');
  const syncCF = useSyncCF();
  const [coachInput, setCoachInput] = useState('');

  if (dashLoading) {
    return <DashboardSkeleton />;
  }

  const stats: DashboardStats | undefined = dashboard;

  if (!stats) {
    return <DashboardEmpty onSync={() => syncCF.mutate()} syncing={syncCF.isPending} />;
  }

  // Derive weak topics — bottom 4 by estimated_skill
  const weakTopics: { name: string; score: number; color: string }[] = [...stats.topic_stats]
    .filter((t) => t.problems_solved > 0)
    .sort((a, b) => a.estimated_skill - b.estimated_skill)
    .slice(0, 4)
    .map((t) => ({
      name: t.tag_name,
      score: Math.round(t.estimated_skill),
      color: t.estimated_skill < 45 ? 'bg-red-500' : 'bg-neon-orange',
    }));

  // Active path for sidebar
  const currentPath = activePaths && activePaths.length > 0 ? activePaths[0] : null;

  // Recent solves for activity feed
  const recentSolves = stats.recent_solves.slice(0, 5);

  // Quick coach handler
  const handleCoachSubmit = () => {
    if (coachInput.trim()) {
      navigate('/app/coach', { state: { initialMessage: coachInput.trim() } });
    } else {
      navigate('/app/coach');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">
            Welcome back, <span className="text-primary">{user?.username || 'Coder'}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stats.current_streak_days > 0
              ? `Continue your training — you're on a ${stats.current_streak_days}-day streak!`
              : 'Start solving to build your streak!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncCF.mutate()}
            disabled={syncCF.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncCF.isPending ? 'animate-spin' : ''}`} />
            {syncCF.isPending ? 'Syncing...' : 'Sync CF'}
          </button>
          <button
            onClick={() => navigate('/app/practice')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary border border-border rounded-lg hover:bg-accent transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Practice Path
          </button>
          <button
            onClick={() => navigate('/app/coach')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Brain className="w-4 h-4" />
            Open AI Coach
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Trophy,
            label: 'Problems Solved',
            value: stats.total_problems_solved.toLocaleString(),
            change: `${stats.total_problems_attempted} attempted`,
            color: 'text-neon-orange',
            bg: 'bg-neon-orange/10',
          },
          {
            icon: Flame,
            label: 'Current Streak',
            value: `${stats.current_streak_days} day${stats.current_streak_days !== 1 ? 's' : ''}`,
            change: stats.current_streak_days > 3 ? 'Keep it up!' : 'Build your streak!',
            color: 'text-neon-green',
            bg: 'bg-neon-green/10',
          },
          {
            icon: TrendingUp,
            label: 'Est. Rating',
            value: stats.estimated_rating ? stats.estimated_rating.toLocaleString() : '—',
            change: `${stats.active_paths} active path${stats.active_paths !== 1 ? 's' : ''}`,
            color: 'text-neon-cyan',
            bg: 'bg-neon-cyan/10',
          },
          {
            icon: Target,
            label: 'Time Spent',
            value: formatHours(stats.total_time_spent_hours),
            change: `${stats.completed_paths} path${stats.completed_paths !== 1 ? 's' : ''} completed`,
            color: 'text-neon-purple',
            bg: 'bg-neon-purple/10',
          },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className={`text-xs mt-1 ${s.color}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Coach Input */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Quick Ask AI Coach</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask about a concept, algorithm, or get a hint..."
                className="flex-1 px-4 py-2.5 text-sm bg-secondary/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                onKeyDown={(e) => e.key === 'Enter' && handleCoachSubmit()}
              />
              <button
                onClick={handleCoachSubmit}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <span className="text-sm font-semibold">Recent Activity</span>
              <button
                onClick={() => navigate('/app/analytics')}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View All
              </button>
            </div>
            {recentSolves.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentSolves.map((solve) => {
                  const StatusIcon = statusIcons[solve.status] || CheckCircle2;
                  return (
                    <div
                      key={solve.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon
                          className={`w-4 h-4 shrink-0 ${statusColors[solve.status] || 'text-muted-foreground'}`}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            Problem #{solve.problem_id}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {solve.attempts} attempt{solve.attempts !== 1 ? 's' : ''}
                              {solve.hints_used > 0 &&
                                ` · ${solve.hints_used} hint${solve.hints_used !== 1 ? 's' : ''}`}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            solve.status === 'solved'
                              ? 'bg-neon-green/10 text-neon-green'
                              : solve.status === 'attempted'
                                ? 'bg-neon-orange/10 text-neon-orange'
                                : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {solve.status}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(solve.solved_at || solve.first_attempted_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No activity yet. Start solving problems!
              </div>
            )}
          </div>

          {/* Rating Distribution (simple visual) */}
          {Object.keys(stats.rating_distribution).length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Rating Distribution</span>
                </div>
                <button
                  onClick={() => navigate('/app/analytics')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Full Analytics
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-end gap-1 h-32">
                  {Object.entries(stats.rating_distribution)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([rating, count]) => {
                      const maxCount = Math.max(...Object.values(stats.rating_distribution), 1);
                      const height = Math.max((count / maxCount) * 100, 4);
                      return (
                        <div
                          key={rating}
                          className="flex-1 flex flex-col items-center gap-1 group relative"
                        >
                          <div
                            className={`w-full rounded-t-sm transition-all ${ratingColor(Number(rating)).replace('text-', 'bg-')} opacity-70 hover:opacity-100`}
                            style={{ height: `${height}%` }}
                            title={`Rating ${rating}: ${count} problems`}
                          />
                        </div>
                      );
                    })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Object.keys(stats.rating_distribution).sort((a, b) => Number(a) - Number(b))[0]}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {Object.keys(stats.rating_distribution).sort((a, b) => Number(b) - Number(a))[0]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Daily Goal / Progress summary */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold">Overview</span>
              <span className="text-xs text-neon-green font-semibold">
                {stats.total_problems_solved} solved
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-primary to-neon-cyan rounded-full transition-all"
                style={{
                  width: `${Math.min((stats.total_problems_solved / Math.max(stats.total_problems_attempted, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total_problems_attempted - stats.total_problems_solved} problems still attempted but unsolved
            </p>
          </div>

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-neon-orange" />
                  <span className="text-sm font-semibold">Weak Topics</span>
                </div>
                <button
                  onClick={() => navigate('/app/analytics')}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Details
                </button>
              </div>
              <div className="space-y-3">
                {weakTopics.map((t) => (
                  <div key={t.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-foreground/80">{t.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{t.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${t.color} rounded-full`}
                        style={{ width: `${t.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Path Progress */}
          {currentPath && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">Current Path</span>
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                  Active
                </span>
              </div>
              <h4 className="text-sm font-semibold mb-2">{currentPath.name}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {currentPath.topics.join(', ')}
              </p>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-muted-foreground">
                  {currentPath.current_position} / {currentPath.total_problems} problems
                </span>
                <span className="text-neon-cyan font-semibold">
                  {Math.round(currentPath.progress_pct)}%
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-primary rounded-full"
                  style={{ width: `${currentPath.progress_pct}%` }}
                />
              </div>
              <button
                onClick={() => navigate(`/app/practice/${currentPath.id}`)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-all"
              >
                Continue Path
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Paths list (if multiple) */}
          {activePaths && activePaths.length > 1 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Other Paths</span>
                <Link
                  to="/app/practice"
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-3">
                {activePaths.slice(1, 4).map((path) => (
                  <Link
                    key={path.id}
                    to={`/app/practice/${path.id}`}
                    className="block rounded-lg border border-border/50 p-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{path.name}</span>
                      <span className="text-xs text-neon-cyan font-semibold ml-2">
                        {Math.round(path.progress_pct)}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-cyan/60 rounded-full"
                        style={{ width: `${path.progress_pct}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <span className="text-sm font-semibold">Quick Actions</span>
            {[
              { icon: Code2, label: 'Browse Problems', action: () => navigate('/app/problems') },
              { icon: BarChart3, label: 'View Analytics', action: () => navigate('/app/analytics') },
              { icon: Brain, label: 'AI Coach Session', action: () => navigate('/app/coach') },
            ].map((q) => (
              <button
                key={q.label}
                onClick={q.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
              >
                <q.icon className="w-4 h-4" />
                {q.label}
                <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
