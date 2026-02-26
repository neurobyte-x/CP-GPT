import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Route,
  Trophy,
  Zap,
  LayoutList,
  TrendingUp,
} from 'lucide-react';
import { clsx } from 'clsx';

import { useDashboard, usePaths, useSyncCF } from '@/hooks/useApi';
import { Card, StatCard, ProgressBar, Spinner, EmptyState } from '@/components/Layout';
import { useAuthStore } from '@/store/authStore';
import type { DashboardStats } from '@/types';

// ── Chart colors ────────────────────────────────────────────────

const RATING_COLORS: Record<string, string> = {
  '800': '#9ca3af',
  '900': '#9ca3af',
  '1000': '#9ca3af',
  '1100': '#9ca3af',
  '1200': '#16a34a',
  '1300': '#16a34a',
  '1400': '#06b6d4',
  '1500': '#06b6d4',
  '1600': '#2563eb',
  '1700': '#2563eb',
  '1800': '#2563eb',
  '1900': '#9333ea',
  '2000': '#9333ea',
  '2100': '#f97316',
  '2200': '#f97316',
  '2300': '#f97316',
  '2400': '#ef4444',
  '2500': '#ef4444',
  '2600': '#b91c1c',
  '2700': '#b91c1c',
  '2800': '#b91c1c',
  '2900': '#b91c1c',
  '3000': '#b91c1c',
  '3100': '#b91c1c',
  '3200': '#b91c1c',
  '3500': '#b91c1c',
};

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function getRatingBarColor(rating: string): string {
  return RATING_COLORS[rating] ?? '#6b7280';
}

// ── Helpers ─────────────────────────────────────────────────────

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 100) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── Main Component ──────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: activePaths, isLoading: pathsLoading } = usePaths('active');
  const syncCF = useSyncCF();

  if (dashLoading) {
    return <Spinner size="lg" />;
  }

  const stats: DashboardStats | undefined = dashboard;

  if (!stats) {
    return (
      <EmptyState
        icon={LayoutList}
        title="No data yet"
        description="Start solving problems or sync your Codeforces account to see your dashboard."
        action={
          <button
            onClick={() => syncCF.mutate()}
            disabled={syncCF.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-4 w-4', syncCF.isPending && 'animate-spin')} />
            Sync Codeforces
          </button>
        }
      />
    );
  }

  // Prepare rating distribution chart data
  const ratingChartData = Object.entries(stats.rating_distribution)
    .map(([rating, count]) => ({
      rating,
      count,
      fill: getRatingBarColor(rating),
    }))
    .sort((a, b) => Number(a.rating) - Number(b.rating));

  // Prepare topic stats — top 8 by problems_solved
  const topTopics = [...stats.topic_stats]
    .sort((a, b) => b.problems_solved - a.problems_solved)
    .slice(0, 8);

  const maxTopicSolved = Math.max(...topTopics.map((t) => t.problems_solved), 1);

  // Prepare pie chart data from topics
  const topicPieData = topTopics.slice(0, 6).map((t) => ({
    name: t.tag_name,
    value: t.problems_solved,
  }));

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {stats.current_streak_days > 0
              ? `You're on a ${stats.current_streak_days}-day streak! Keep it up.`
              : 'Start solving to build your streak!'}
          </p>
        </div>
        <button
          onClick={() => syncCF.mutate()}
          disabled={syncCF.isPending}
          className={clsx(
            'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50',
          )}
        >
          <RefreshCw className={clsx('h-4 w-4', syncCF.isPending && 'animate-spin')} />
          {syncCF.isPending ? 'Syncing...' : 'Sync CF'}
        </button>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Solved"
          value={stats.total_problems_solved}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Active Paths"
          value={stats.active_paths}
          icon={Route}
          color="brand"
        />
        <StatCard
          label="Completed Paths"
          value={stats.completed_paths}
          icon={Trophy}
          color="purple"
        />
        <StatCard
          label="Time Spent"
          value={formatHours(stats.total_time_spent_hours)}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Rating Distribution */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Rating Distribution</h2>
          {ratingChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ratingChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <XAxis
                  dataKey="rating"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`${value} problems`, 'Solved']}
                  labelFormatter={(label) => `Rating ${label}`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ratingChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">
              No rating data available yet.
            </p>
          )}
        </Card>

        {/* Topic Pie Chart */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Topics Breakdown</h2>
          {topicPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={topicPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {topicPieData.map((_entry, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} solved`, 'Problems']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {topicPieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    {entry.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">
              No topic data yet.
            </p>
          )}
        </Card>
      </div>

      {/* ── Topic Progress Bars ────────────────────────────────── */}
      {topTopics.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top Topics</h2>
          <div className="space-y-4">
            {topTopics.map((topic) => (
              <div key={topic.tag_slug}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{topic.tag_name}</span>
                  <span className="text-xs text-gray-500">
                    {topic.problems_solved} solved &middot; avg {Math.round(topic.avg_rating_solved)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{
                      width: `${(topic.problems_solved / maxTopicSolved) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Bottom Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Solves */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Solves</h2>
          {stats.recent_solves.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {stats.recent_solves.slice(0, 8).map((solve) => (
                <li
                  key={solve.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={clsx(
                        'h-5 w-5',
                        solve.status === 'solved' ? 'text-green-500' : 'text-gray-400',
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Problem #{solve.problem_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        {solve.attempts} attempt{solve.attempts !== 1 ? 's' : ''}
                        {solve.hints_used > 0 && ` · ${solve.hints_used} hint${solve.hints_used !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={clsx(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        solve.status === 'solved'
                          ? 'bg-green-100 text-green-700'
                          : solve.status === 'attempted'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {solve.status}
                    </span>
                    {solve.solved_at && (
                      <p className="mt-0.5 text-xs text-gray-400">{timeAgo(solve.solved_at)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              No solves recorded yet. Start practicing!
            </p>
          )}
        </Card>

        {/* Active Paths */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Active Paths</h2>
            <Link
              to="/paths"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all
            </Link>
          </div>
          {pathsLoading ? (
            <Spinner size="sm" />
          ) : activePaths && activePaths.length > 0 ? (
            <ul className="space-y-4">
              {activePaths.slice(0, 5).map((path) => (
                <li key={path.id}>
                  <Link
                    to={`/paths/${path.id}`}
                    className="block rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{path.name}</span>
                      <span className="text-xs font-medium text-brand-600">
                        {Math.round(path.progress_pct)}%
                      </span>
                    </div>
                    <ProgressBar value={path.progress_pct} />
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {path.mode}
                      </span>
                      <span>
                        {path.current_position}/{path.total_problems} problems
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {path.min_rating}–{path.max_rating}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Route}
              title="No active paths"
              description="Create a practice path to get started with structured training."
              action={
                <Link
                  to="/paths"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Create Path
                </Link>
              }
            />
          )}
        </Card>
      </div>
    </div>
  );
}
