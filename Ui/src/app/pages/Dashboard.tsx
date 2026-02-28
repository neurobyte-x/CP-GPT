import { useNavigate } from "react-router";
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
} from "lucide-react";
import { useState } from "react";

const weakTopics = [
  { name: "Dynamic Programming", score: 35, color: "bg-red-500" },
  { name: "Segment Trees", score: 42, color: "bg-red-500" },
  { name: "Number Theory", score: 55, color: "bg-neon-orange" },
  { name: "Graph (Advanced)", score: 60, color: "bg-neon-orange" },
];

const recentActivity = [
  { title: "Two Sum Queries", rating: 1600, status: "solved", time: "2h ago", tags: ["Binary Search", "Sorting"] },
  { title: "Tree Distances", rating: 1800, status: "attempted", time: "5h ago", tags: ["DFS", "Trees"] },
  { title: "String Hashing", rating: 1400, status: "solved", time: "1d ago", tags: ["Hashing", "Strings"] },
  { title: "Knapsack Variants", rating: 2000, status: "skipped", time: "1d ago", tags: ["DP"] },
  { title: "Prefix XOR", rating: 1200, status: "solved", time: "2d ago", tags: ["Bit Manipulation"] },
];

const statusColors: Record<string, string> = {
  solved: "text-neon-green",
  attempted: "text-neon-orange",
  skipped: "text-muted-foreground",
};
const statusIcons: Record<string, typeof CheckCircle2> = {
  solved: CheckCircle2,
  attempted: Clock,
  skipped: AlertTriangle,
};

function ratingColor(r: number) {
  if (r < 1200) return "text-gray-400";
  if (r < 1400) return "text-green-400";
  if (r < 1600) return "text-cyan-400";
  if (r < 1900) return "text-blue-400";
  if (r < 2100) return "text-purple-400";
  return "text-red-400";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [coachInput, setCoachInput] = useState("");

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl" style={{ fontWeight: 700 }}>
            Welcome back, <span className="text-primary">Coder</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Continue your training — you're on a 7-day streak!</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/app/practice")}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary border border-border rounded-lg hover:bg-accent transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Practice Path
          </button>
          <button
            onClick={() => navigate("/app/coach")}
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
          { icon: Trophy, label: "Problems Solved", value: "142", change: "+12 this week", color: "text-neon-orange", bg: "bg-neon-orange/10" },
          { icon: Flame, label: "Current Streak", value: "7 days", change: "Personal best!", color: "text-neon-green", bg: "bg-neon-green/10" },
          { icon: TrendingUp, label: "Est. Rating", value: "1,650", change: "+85 this month", color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
          { icon: Target, label: "Path Progress", value: "68%", change: "Graph Algorithms", color: "text-neon-purple", bg: "bg-neon-purple/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <div className="text-2xl" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className={`text-xs mt-1 ${s.color}`}>{s.change}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Problem */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm" style={{ fontWeight: 600 }}>Recommended Next Problem</span>
              </div>
              <span className="text-xs text-muted-foreground">AI Selected</span>
            </div>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base mb-1" style={{ fontWeight: 600 }}>
                    CF 1842D — Tenzing and His Animal Friends
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`text-sm ${ratingColor(1700)}`} style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                      1700
                    </span>
                    {["Graphs", "Greedy", "Constructive"].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 text-xs bg-accent border border-border rounded-md text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This problem targets your graph skills at an appropriate difficulty stretch.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate("/app/problem/1842D")}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Start Solving
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Coach Input */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-sm" style={{ fontWeight: 600 }}>Quick Ask AI Coach</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask about a concept, algorithm, or get a hint..."
                className="flex-1 px-4 py-2.5 text-sm bg-secondary/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                onKeyDown={(e) => e.key === "Enter" && navigate("/app/coach")}
              />
              <button
                onClick={() => navigate("/app/coach")}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <span className="text-sm" style={{ fontWeight: 600 }}>Recent Activity</span>
              <button className="text-xs text-primary hover:text-primary/80 transition-colors">View All</button>
            </div>
            <div className="divide-y divide-border/50">
              {recentActivity.map((a) => {
                const StatusIcon = statusIcons[a.status];
                return (
                  <div key={a.title} className="px-4 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <StatusIcon className={`w-4 h-4 shrink-0 ${statusColors[a.status]}`} />
                      <div className="min-w-0">
                        <div className="text-sm truncate" style={{ fontWeight: 500 }}>{a.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${ratingColor(a.rating)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {a.rating}
                          </span>
                          <span className="text-xs text-muted-foreground">{a.tags.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-3">{a.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Daily Goal */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ fontWeight: 600 }}>Daily Goal</span>
              <span className="text-xs text-neon-green" style={{ fontWeight: 600 }}>3/5 problems</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-primary to-neon-cyan rounded-full transition-all" style={{ width: "60%" }} />
            </div>
            <p className="text-xs text-muted-foreground">Solve 2 more problems to hit your daily target</p>
          </div>

          {/* Weak Topics */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-neon-orange" />
                <span className="text-sm" style={{ fontWeight: 600 }}>Weak Topics</span>
              </div>
              <button onClick={() => navigate("/app/analytics")} className="text-xs text-primary hover:text-primary/80 transition-colors">
                Details
              </button>
            </div>
            <div className="space-y-3">
              {weakTopics.map((t) => (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-foreground/80">{t.name}</span>
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {t.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Path Progress */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ fontWeight: 600 }}>Current Path</span>
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded" style={{ fontWeight: 500 }}>Active</span>
            </div>
            <h4 className="text-sm mb-2" style={{ fontWeight: 600 }}>Graph Algorithms Mastery</h4>
            <p className="text-xs text-muted-foreground mb-3">BFS, DFS, Shortest Paths, MST, Advanced Graphs</p>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">17 / 25 problems</span>
              <span className="text-neon-cyan" style={{ fontWeight: 600 }}>68%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-neon-cyan to-primary rounded-full" style={{ width: "68%" }} />
            </div>
            <button
              onClick={() => navigate("/app/practice")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-all"
            >
              Continue Path
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <span className="text-sm" style={{ fontWeight: 600 }}>Quick Actions</span>
            {[
              { icon: Code2, label: "Random Problem", action: () => navigate("/app/problem/random") },
              { icon: BarChart3, label: "View Analytics", action: () => navigate("/app/analytics") },
              { icon: Brain, label: "AI Coach Session", action: () => navigate("/app/coach") },
            ].map((q) => (
              <button
                key={q.label}
                onClick={q.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all"
              >
                <q.icon className="w-4 h-4" />
                {q.label}
                <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}