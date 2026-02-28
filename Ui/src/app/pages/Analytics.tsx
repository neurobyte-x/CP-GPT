import {
  BarChart3,
  TrendingUp,
  Target,
  Calendar,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Flame,
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

const solvedOverTime = [
  { month: "Sep", problems: 8 },
  { month: "Oct", problems: 15 },
  { month: "Nov", problems: 22 },
  { month: "Dec", problems: 18 },
  { month: "Jan", problems: 32 },
  { month: "Feb", problems: 28 },
  { month: "Mar", problems: 42 },
];

const ratingDistribution = [
  { range: "800-1000", count: 12, fill: "#6b7280" },
  { range: "1000-1200", count: 28, fill: "#22c55e" },
  { range: "1200-1400", count: 35, fill: "#06b6d4" },
  { range: "1400-1600", count: 30, fill: "#3b82f6" },
  { range: "1600-1800", count: 22, fill: "#a855f7" },
  { range: "1800-2000", count: 12, fill: "#f59e0b" },
  { range: "2000+", count: 3, fill: "#ef4444" },
];

const topicPerformance = [
  { topic: "Graphs", score: 78 },
  { topic: "DP", score: 42 },
  { topic: "Greedy", score: 85 },
  { topic: "Math", score: 60 },
  { topic: "Strings", score: 72 },
  { topic: "Trees", score: 55 },
  { topic: "Binary Search", score: 90 },
  { topic: "Data Structures", score: 65 },
];

const pathCompletion = [
  { name: "Graph Algorithms", value: 68, color: "#6366f1" },
  { name: "DP Foundations", value: 40, color: "#22d3ee" },
  { name: "Number Theory", value: 17, color: "#a855f7" },
  { name: "Remaining", value: 75, color: "#161616" },
];

const weeklyActivity = [
  { day: "Mon", problems: 3 },
  { day: "Tue", problems: 5 },
  { day: "Wed", problems: 2 },
  { day: "Thu", problems: 4 },
  { day: "Fri", problems: 6 },
  { day: "Sat", problems: 8 },
  { day: "Sun", problems: 4 },
];

const weakAreas = [
  { topic: "Dynamic Programming", accuracy: 35, attempted: 28, solved: 10, trend: "improving" },
  { topic: "Segment Trees", accuracy: 42, attempted: 12, solved: 5, trend: "stable" },
  { topic: "Number Theory", accuracy: 55, attempted: 20, solved: 11, trend: "improving" },
  { topic: "Advanced Graphs", accuracy: 60, attempted: 15, solved: 9, trend: "declining" },
  { topic: "Geometry", accuracy: 30, attempted: 10, solved: 3, trend: "stable" },
];

const trendColors: Record<string, string> = {
  improving: "text-neon-green",
  stable: "text-neon-orange",
  declining: "text-red-400",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm" style={{ fontWeight: 600, color: payload[0].color || "#6366f1" }}>
          {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your progress, identify weaknesses, and measure improvement
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: "Total Solved", value: "142", sub: "All time", color: "text-neon-orange", bg: "bg-neon-orange/10" },
          { icon: TrendingUp, label: "Est. Rating", value: "1,650", sub: "+85 this month", color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
          { icon: Flame, label: "Best Streak", value: "14 days", sub: "Current: 7", color: "text-neon-green", bg: "bg-neon-green/10" },
          { icon: Target, label: "Accuracy", value: "71%", sub: "142/200 attempts", color: "text-neon-purple", bg: "bg-neon-purple/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className={`text-xs mt-1 ${s.color}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Problems Over Time */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm" style={{ fontWeight: 600 }}>Problems Solved Over Time</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly trend</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neon-green">
              <TrendingUp className="w-3.5 h-3.5" />
              <span style={{ fontWeight: 600 }}>+50%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={solvedOverTime}>
              <defs>
                <linearGradient id="colorProblems" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="problems"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProblems)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Distribution */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm" style={{ fontWeight: 600 }}>Rating Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Problems solved by difficulty</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ratingDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Topic Radar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm" style={{ fontWeight: 600 }}>Topic Performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Skill across categories</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={topicPerformance}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="topic"
                tick={{ fill: "#71717a", fontSize: 10 }}
              />
              <PolarRadiusAxis
                tick={{ fill: "#71717a", fontSize: 9 }}
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
        </div>

        {/* Weak Areas */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-neon-orange" />
              <h3 className="text-sm" style={{ fontWeight: 600 }}>Weak Areas</h3>
            </div>
            <span className="text-xs text-muted-foreground">Sorted by accuracy</span>
          </div>
          <div className="space-y-3">
            {weakAreas.map((area) => (
              <div key={area.topic} className="flex items-center gap-4">
                <div className="w-36 text-sm truncate" style={{ fontWeight: 500 }}>{area.topic}</div>
                <div className="flex-1">
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        area.accuracy < 40
                          ? "bg-red-500"
                          : area.accuracy < 60
                          ? "bg-neon-orange"
                          : "bg-neon-green"
                      }`}
                      style={{ width: `${area.accuracy}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {area.accuracy}%
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {area.solved}/{area.attempted}
                </span>
                <span className={`text-xs w-16 text-right ${trendColors[area.trend]}`} style={{ fontWeight: 500 }}>
                  {area.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm" style={{ fontWeight: 600 }}>Weekly Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">This week</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Feb 21 - Feb 27</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="problems" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Path Completion */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="mb-4">
            <h3 className="text-sm" style={{ fontWeight: 600 }}>Path Completion</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Learning path progress</p>
          </div>
          <div className="space-y-4">
            {[
              { name: "Graph Algorithms", progress: 68, total: 25, solved: 17, color: "bg-primary" },
              { name: "DP Foundations", progress: 40, total: 20, solved: 8, color: "bg-neon-cyan" },
              { name: "Number Theory", progress: 17, total: 18, solved: 3, color: "bg-neon-purple" },
            ].map((path) => (
              <div key={path.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm" style={{ fontWeight: 500 }}>{path.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {path.solved}/{path.total}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${path.color} rounded-full`} style={{ width: `${path.progress}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {path.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-green" />
                <span className="text-sm" style={{ fontWeight: 500 }}>Overall Completion</span>
              </div>
              <span className="text-lg text-primary" style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                44%
              </span>
            </div>
            <div className="mt-2 w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary via-neon-cyan to-neon-purple rounded-full" style={{ width: "44%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}