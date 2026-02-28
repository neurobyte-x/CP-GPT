/**
 * Analytics page — detailed view of user progress, topic mastery, and activity.
 * Wired to real data via useDashboard(), useTopicStats(), usePaths().
 */

import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import { useDashboard, useTopicStats, usePaths } from '@/hooks/useApi';

// Rating bucket → bar color
const RATING_COLORS: Record<string, string> = {
  '800': '#6b7280',
  '900': '#6b7280',
  '1000': '#22c55e',
  '1100': '#22c55e',
  '1200': '#06b6d4',
  '1300': '#06b6d4',
  '1400': '#3b82f6',
  '1500': '#3b82f6',
  '1600': '#a855f7',
  '1700': '#a855f7',
  '1800': '#f59e0b',
  '1900': '#f59e0b',
  '2000': '#ef4444',
  '2100': '#ef4444',
  '2200': '#ef4444',
  '2300': '#ef4444',
  '2400': '#ef4444',
  '2500': '#ef4444',
};

function getRatingBarColor(bucket: string): string {
  // bucket is like "800", "1000", "1200", etc.
  return RATING_COLORS[bucket] || '#6366f1';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className="text-sm font-semibold"
          style={{ color: payload[0].color || '#6366f1' }}
        >
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function StatsPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: topicStats, isLoading: topicsLoading } = useTopicStats();
  const { data: paths, isLoading: pathsLoading } = usePaths();

  const isLoading = dashLoading || topicsLoading || pathsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────

  const totalSolved = dashboard?.total_problems_solved ?? 0;
  const totalAttempted = dashboard?.total_problems_attempted ?? 0;
  const accuracy = totalAttempted > 0 ? Math.round((totalSolved / totalAttempted) * 100) : 0;
  const estimatedRating = dashboard?.estimated_rating ?? null;
  const streakDays = dashboard?.current_streak_days ?? 0;

  // Rating distribution chart data
  const ratingData = dashboard
    ? Object.entries(dashboard.rating_distribution)
        .map(([bucket, count]) => ({
          range: bucket,
          count,
          fill: getRatingBarColor(bucket),
        }))
        .sort((a, b) => Number(a.range) - Number(b.range))
    : [];

  // Topic radar data (top 8)
  const radarData = (topicStats ?? []).slice(0, 8).map((ts) => ({
    topic: ts.tag_name.length > 12 ? ts.tag_name.slice(0, 12) + '...' : ts.tag_name,
    score: Math.max(0, Math.min(100, Math.round(((ts.estimated_skill - 800) / 1600) * 100))),
  }));

  // Weak areas: topics sorted by accuracy (lowest first)
  const weakAreas = (topicStats ?? [])
    .filter((ts) => ts.problems_attempted > 0)
    .map((ts) => ({
      topic: ts.tag_name,
      accuracy: ts.problems_attempted > 0
        ? Math.round((ts.problems_solved / ts.problems_attempted) * 100)
        : 0,
      attempted: ts.problems_attempted,
      solved: ts.problems_solved,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  // Path completion data
  const activePaths = (paths ?? [])
    .filter((p) => p.status === 'active' || p.status === 'completed')
    .slice(0, 5);

  const pathColors = ['bg-primary', 'bg-neon-cyan', 'bg-neon-purple', 'bg-neon-green', 'bg-neon-orange'];

  const overallPathProgress =
    activePaths.length > 0
      ? Math.round(activePaths.reduce((sum, p) => sum + p.progress_pct, 0) / activePaths.length)
      : 0;

  // Recent solves for trend placeholder
  const recentSolves = dashboard?.recent_solves ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your progress, identify weaknesses, and measure improvement
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: Trophy,
            label: 'Total Solved',
            value: totalSolved.toLocaleString(),
            sub: 'All time',
            color: 'text-neon-orange',
            bg: 'bg-neon-orange/10',
          },
          {
            icon: TrendingUp,
            label: 'Est. Rating',
            value: estimatedRating ? estimatedRating.toLocaleString() : 'N/A',
            sub: `${totalAttempted} attempted`,
            color: 'text-neon-cyan',
            bg: 'bg-neon-cyan/10',
          },
          {
            icon: Flame,
            label: 'Current Streak',
            value: `${streakDays} days`,
            sub: `${dashboard?.active_paths ?? 0} active paths`,
            color: 'text-neon-green',
            bg: 'bg-neon-green/10',
          },
          {
            icon: Target,
            label: 'Accuracy',
            value: `${accuracy}%`,
            sub: `${totalSolved}/${totalAttempted} attempts`,
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
            <div className={`text-xs mt-1 ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Rating Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Problems solved by difficulty</p>
          </div>
          {ratingData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="range"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {ratingData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
              No rating data yet. Solve some problems to see your distribution.
            </div>
          )}
        </div>

        {/* Recent Activity Trend */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Recent Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {recentSolves.length} recent solves
              </p>
            </div>
            {recentSolves.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-neon-green">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-semibold">Active</span>
              </div>
            )}
          </div>
          {recentSolves.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={recentSolves.slice(-10).map((s, i) => ({
                  idx: i + 1,
                  attempts: s.attempts,
                }))}
              >
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="idx"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="attempts"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
              No recent activity yet.
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topic Radar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Topic Performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Skill across categories</p>
          </div>
          {radarData.length > 2 ? (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="topic"
                  tick={{ fill: '#71717a', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  tick={{ fill: '#71717a', fontSize: 9 }}
                  domain={[0, 100]}
                  axisLine={false}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground text-center px-4">
              Need data in at least 3 topics for radar chart. Keep solving!
            </div>
          )}
        </div>

        {/* Weak Areas */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-orange" />
              <h3 className="text-sm font-semibold">Weak Areas</h3>
            </div>
            <span className="text-xs text-muted-foreground">Sorted by accuracy</span>
          </div>
          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map((area) => (
                <div key={area.topic} className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium truncate">{area.topic}</div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          area.accuracy < 40
                            ? 'bg-red-500'
                            : area.accuracy < 60
                            ? 'bg-neon-orange'
                            : 'bg-neon-green'
                        }`}
                        style={{ width: `${area.accuracy}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-xs text-muted-foreground w-10 text-right"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {area.accuracy}%
                  </span>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {area.solved}/{area.attempted}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No topic data yet. Solve problems to see weak areas.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Topic Breakdown Table */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Topic Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Detailed topic statistics</p>
          </div>
          {topicStats && topicStats.length > 0 ? (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {topicStats.map((ts) => {
                const skillPct = Math.max(0, Math.min(100, Math.round(((ts.estimated_skill - 800) / 1600) * 100)));
                return (
                  <div key={ts.tag_slug} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate mr-2">{ts.tag_name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          {ts.problems_solved} solved
                        </span>
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            color:
                              ts.estimated_skill < 1200 ? '#9ca3af' :
                              ts.estimated_skill < 1400 ? '#4ade80' :
                              ts.estimated_skill < 1600 ? '#22d3ee' :
                              ts.estimated_skill < 1900 ? '#60a5fa' :
                              ts.estimated_skill < 2100 ? '#c084fc' :
                              '#f87171',
                          }}
                        >
                          {ts.estimated_skill}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${skillPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No topic data yet.
            </div>
          )}
        </div>

        {/* Path Completion */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Path Completion</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Learning path progress</p>
          </div>
          {activePaths.length > 0 ? (
            <>
              <div className="space-y-4">
                {activePaths.map((path, i) => {
                  const solved = Math.round((path.progress_pct / 100) * path.total_problems);
                  return (
                    <div key={path.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate mr-2">{path.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {solved}/{path.total_problems}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pathColors[i % pathColors.length]} rounded-full transition-all`}
                            style={{ width: `${path.progress_pct}%` }}
                          />
                        </div>
                        <span
                          className="text-xs text-muted-foreground w-8 text-right"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {path.progress_pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-neon-green" />
                    <span className="text-sm font-medium">Overall Completion</span>
                  </div>
                  <span
                    className="text-lg text-primary font-bold"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {overallPathProgress}%
                  </span>
                </div>
                <div className="mt-2 w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-neon-cyan to-neon-purple rounded-full transition-all"
                    style={{ width: `${overallPathProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No active paths yet. Create a practice path to track progress.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
