import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Route,
  Star,
  Lock,
  ChevronDown,
  ChevronRight,
  Tag,
  Trophy,
  Zap,
  Filter,
  Users,
} from "lucide-react";

interface Problem {
  id: string;
  title: string;
  rating: number;
  tags: string[];
  solveCount: number;
  status: "solved" | "attempted" | "unsolved" | "locked";
}

interface PracticePath {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  difficultyColor: string;
  progress: number;
  total: number;
  problems: Problem[];
  active: boolean;
}

const paths: PracticePath[] = [
  {
    id: "1",
    title: "Graph Algorithms Mastery",
    description: "Master graph traversal, shortest paths, MST, and advanced graph techniques",
    difficulty: "Intermediate",
    difficultyColor: "text-neon-cyan",
    progress: 17,
    total: 25,
    active: true,
    problems: [
      { id: "1", title: "Connected Components", rating: 1200, tags: ["DFS", "BFS"], solveCount: 12400, status: "solved" },
      { id: "2", title: "Shortest Path Basics", rating: 1300, tags: ["BFS", "Dijkstra"], solveCount: 9800, status: "solved" },
      { id: "3", title: "Cycle Detection", rating: 1400, tags: ["DFS", "Coloring"], solveCount: 7600, status: "solved" },
      { id: "4", title: "Bipartite Check", rating: 1500, tags: ["BFS", "Graph Coloring"], solveCount: 6200, status: "solved" },
      { id: "5", title: "MST Construction", rating: 1600, tags: ["Kruskal", "Union-Find"], solveCount: 5100, status: "solved" },
      { id: "6", title: "Topological Sorting", rating: 1600, tags: ["DAG", "DFS"], solveCount: 4800, status: "attempted" },
      { id: "7", title: "Bridges and Articulation Points", rating: 1700, tags: ["DFS", "Low-Link"], solveCount: 3900, status: "unsolved" },
      { id: "8", title: "Strongly Connected Components", rating: 1800, tags: ["Tarjan", "Kosaraju"], solveCount: 3100, status: "unsolved" },
      { id: "9", title: "2-SAT via Graphs", rating: 1900, tags: ["SCC", "Implication Graph"], solveCount: 2200, status: "locked" },
      { id: "10", title: "Euler Path & Circuit", rating: 2000, tags: ["Euler Tour", "DFS"], solveCount: 1800, status: "locked" },
    ],
  },
  {
    id: "2",
    title: "Dynamic Programming Foundations",
    description: "Build a solid foundation in DP from basic recursion to advanced techniques",
    difficulty: "Beginner",
    difficultyColor: "text-neon-green",
    progress: 8,
    total: 20,
    active: false,
    problems: [
      { id: "11", title: "Fibonacci Variants", rating: 1000, tags: ["Basic DP"], solveCount: 18000, status: "solved" },
      { id: "12", title: "Coin Change", rating: 1100, tags: ["DP", "Greedy"], solveCount: 15000, status: "solved" },
      { id: "13", title: "Longest Increasing Subsequence", rating: 1300, tags: ["DP", "Binary Search"], solveCount: 11000, status: "solved" },
      { id: "14", title: "Knapsack 0/1", rating: 1400, tags: ["DP"], solveCount: 9500, status: "attempted" },
      { id: "15", title: "Edit Distance", rating: 1500, tags: ["DP", "Strings"], solveCount: 7800, status: "unsolved" },
    ],
  },
  {
    id: "3",
    title: "Number Theory & Combinatorics",
    description: "Primes, modular arithmetic, GCD, and counting techniques for CP",
    difficulty: "Advanced",
    difficultyColor: "text-neon-purple",
    progress: 3,
    total: 18,
    active: false,
    problems: [
      { id: "16", title: "Sieve of Eratosthenes", rating: 1200, tags: ["Primes", "Sieve"], solveCount: 13000, status: "solved" },
      { id: "17", title: "Modular Exponentiation", rating: 1400, tags: ["Math", "Binary Exp"], solveCount: 9000, status: "solved" },
      { id: "18", title: "Extended GCD", rating: 1600, tags: ["Math", "Number Theory"], solveCount: 5500, status: "unsolved" },
    ],
  },
];

const statusConfig = {
  solved: { icon: CheckCircle2, color: "text-neon-green", bg: "bg-neon-green", label: "Solved" },
  attempted: { icon: Clock, color: "text-neon-orange", bg: "bg-neon-orange", label: "Attempted" },
  unsolved: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted-foreground", label: "Unsolved" },
  locked: { icon: Lock, color: "text-muted-foreground/40", bg: "bg-muted-foreground/40", label: "Locked" },
};

function ratingColor(r: number) {
  if (r < 1200) return "text-gray-400";
  if (r < 1400) return "text-green-400";
  if (r < 1600) return "text-cyan-400";
  if (r < 1900) return "text-blue-400";
  if (r < 2100) return "text-purple-400";
  return "text-red-400";
}

export default function PracticePath() {
  const navigate = useNavigate();
  const [expandedPath, setExpandedPath] = useState<string | null>("1");

  return (
    <div className="p-4 lg:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Route className="w-5 h-5 text-primary" />
            <h1 className="text-2xl" style={{ fontWeight: 700 }}>Practice Paths</h1>
          </div>
          <p className="text-sm text-muted-foreground">Follow structured learning paths to master competitive programming topics</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Trophy, label: "Paths Active", value: "3", color: "text-neon-orange", bg: "bg-neon-orange/10" },
          { icon: CheckCircle2, label: "Problems Solved", value: "28 / 63", color: "text-neon-green", bg: "bg-neon-green/10" },
          { icon: Zap, label: "Avg Rating", value: "1,480", color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-lg" style={{ fontWeight: 700 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Paths */}
      <div className="space-y-4">
        {paths.map((path) => {
          const pct = Math.round((path.progress / path.total) * 100);
          const isExpanded = expandedPath === path.id;
          const resumeIdx = path.problems.findIndex(
            (p) => p.status === "attempted" || p.status === "unsolved"
          );

          return (
            <div key={path.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Path Header */}
              <button
                onClick={() => setExpandedPath(isExpanded ? null : path.id)}
                className="w-full flex items-center justify-between p-4 lg:p-5 hover:bg-accent/30 transition-colors text-left"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-lg ${path.active ? "bg-primary/15" : "bg-secondary"} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Route className={`w-5 h-5 ${path.active ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm" style={{ fontWeight: 600 }}>{path.title}</h3>
                      {path.active && (
                        <span className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded" style={{ fontWeight: 600 }}>
                          ACTIVE
                        </span>
                      )}
                      <span className={`text-xs ${path.difficultyColor}`} style={{ fontWeight: 500 }}>
                        {path.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{path.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {pct}%
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {path.progress}/{path.total} solved
                      </span>
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Problems List */}
              {isExpanded && (
                <div className="border-t border-border/50">
                  {path.problems.map((problem, idx) => {
                    const config = statusConfig[problem.status];
                    const StatusIcon = config.icon;
                    const isResume = idx === resumeIdx;

                    return (
                      <div
                        key={problem.id}
                        className={`flex items-center gap-3 px-4 lg:px-5 py-3 border-b border-border/30 last:border-b-0 transition-colors ${
                          problem.status === "locked"
                            ? "opacity-50"
                            : "hover:bg-accent/30 cursor-pointer"
                        } ${isResume ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                        onClick={() =>
                          problem.status !== "locked" && navigate(`/app/problem/${problem.id}`)
                        }
                      >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center gap-0 shrink-0">
                          <StatusIcon className={`w-5 h-5 ${config.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm truncate" style={{ fontWeight: 500 }}>
                              {problem.title}
                            </span>
                            {isResume && (
                              <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded" style={{ fontWeight: 600 }}>
                                RESUME
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {problem.tags.map((tag) => (
                              <span key={tag} className="text-[10px] text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {problem.solveCount.toLocaleString()}
                          </div>
                          <span
                            className={`text-xs ${ratingColor(problem.rating)}`}
                            style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {problem.rating}
                          </span>
                          {problem.status !== "locked" && (
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
