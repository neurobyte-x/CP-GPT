import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ExternalLink,
  Tag,
  Clock,
  CheckCircle2,
  Brain,
  Lightbulb,
  BookOpen,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  FileText,
  Eye,
  Send,
  Users,
  ThumbsUp,
  ChevronDown,
} from "lucide-react";

const problemData = {
  id: "1842D",
  title: "Tenzing and His Animal Friends",
  contestId: 1842,
  rating: 1700,
  tags: ["Graphs", "Greedy", "Constructive Algorithms"],
  solveCount: 4231,
  timeLimit: "1 second",
  memoryLimit: "256 MB",
  statement: `Tenzing has n animals. The i-th animal has a weight of w_i.

Tenzing wants to divide the animals into some groups such that for each group:
- The total weight of all animals in the group is at most W.
- For any two animals in the same group, they must be friends.

Given the friendship graph, find the minimum number of groups needed, or report that it's impossible.

**Input:** The first line contains three integers n, m, and W — the number of animals, edges, and weight limit.
The second line contains n integers w_1, w_2, ..., w_n — the weights of the animals.
Each of the next m lines contains two integers u and v — meaning animals u and v are friends.

**Output:** Print the minimum number of groups, or -1 if impossible.`,
  examples: [
    { input: "5 4 10\n3 2 5 4 1\n1 2\n2 3\n3 4\n4 5", output: "2" },
    { input: "3 1 5\n3 3 3\n1 2", output: "-1" },
  ],
};

function ratingColor(r: number) {
  if (r < 1200) return "text-gray-400";
  if (r < 1400) return "text-green-400";
  if (r < 1600) return "text-cyan-400";
  if (r < 1900) return "text-blue-400";
  if (r < 2100) return "text-purple-400";
  return "text-red-400";
}

export default function ProblemWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [notes, setNotes] = useState("- Graph problem: model friends as edges\n- Consider bipartite check\n- Weight constraint adds complexity");
  const [status, setStatus] = useState<"unsolved" | "attempting" | "solved">("attempting");
  const [showCoach, setShowCoach] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [activeTab, setActiveTab] = useState<"statement" | "notes" | "editorial">("statement");

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Problem Header */}
      <div className="px-4 lg:px-6 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm truncate" style={{ fontWeight: 600 }}>
                  CF {problemData.id} — {problemData.title}
                </h2>
                <span
                  className={`text-xs ${ratingColor(problemData.rating)}`}
                  style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {problemData.rating}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <div className="flex items-center gap-1.5">
                  {problemData.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-accent rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Timer */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                {formatTime(timerSeconds)}
              </span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setTimerSeconds(0); setTimerRunning(false); }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none cursor-pointer"
            >
              <option value="unsolved">Unsolved</option>
              <option value="attempting">Attempting</option>
              <option value="solved">Solved</option>
            </select>

            <a
              href={`https://codeforces.com/problemset/problem/${problemData.contestId}/D`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Codeforces
            </a>

            <button
              onClick={() => setShowCoach(!showCoach)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                showCoach
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              Coach
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tabs */}
          <div className="flex border-b border-border/50 px-4 lg:px-6 shrink-0">
            {[
              { key: "statement" as const, label: "Problem", icon: FileText },
              { key: "notes" as const, label: "Notes", icon: BookOpen },
              { key: "editorial" as const, label: "Editorial", icon: Eye },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
                style={{ fontWeight: activeTab === tab.key ? 600 : 400 }}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {activeTab === "statement" && (
              <div className="max-w-3xl space-y-6">
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {problemData.timeLimit}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {problemData.memoryLimit}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {problemData.solveCount.toLocaleString()} solves
                  </div>
                </div>

                {/* Statement */}
                <div className="text-sm text-foreground/90 space-y-3" style={{ lineHeight: 1.8 }}>
                  {problemData.statement.split("\n\n").map((para, i) => {
                    if (para.startsWith("**")) {
                      const parts = para.split("**");
                      return (
                        <div key={i}>
                          <h4 className="text-foreground mb-1" style={{ fontWeight: 600 }}>
                            {parts[1]}
                          </h4>
                          <p className="text-foreground/80">{parts[2]}</p>
                        </div>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })}
                </div>

                {/* Examples */}
                <div>
                  <h4 className="text-sm mb-3" style={{ fontWeight: 600 }}>Examples</h4>
                  <div className="space-y-3">
                    {problemData.examples.map((ex, i) => (
                      <div key={i} className="grid grid-cols-2 gap-3">
                        <div className="bg-secondary/50 border border-border/50 rounded-lg overflow-hidden">
                          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/50" style={{ fontWeight: 600 }}>
                            INPUT
                          </div>
                          <pre className="p-3 text-xs text-foreground/90" style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                            {ex.input}
                          </pre>
                        </div>
                        <div className="bg-secondary/50 border border-border/50 rounded-lg overflow-hidden">
                          <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/50" style={{ fontWeight: 600 }}>
                            OUTPUT
                          </div>
                          <pre className="p-3 text-xs text-foreground/90" style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                            {ex.output}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="max-w-3xl">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write your approach, observations, and ideas here..."
                  className="w-full h-[500px] px-4 py-3 text-sm bg-secondary/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/40"
                  style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}
                />
              </div>
            )}

            {activeTab === "editorial" && (
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 p-6 bg-secondary/30 border border-border/50 rounded-lg">
                  <Eye className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h4 className="text-sm mb-1" style={{ fontWeight: 600 }}>Editorial Hidden</h4>
                    <p className="text-xs text-muted-foreground">
                      Try solving the problem first, or ask the AI Coach for progressive hints.
                    </p>
                    <button className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neon-purple/30 text-neon-purple rounded-lg hover:bg-neon-purple/5 transition-all">
                      <Eye className="w-3.5 h-3.5" />
                      Reveal Editorial
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dockable Coach Panel */}
        {showCoach && (
          <div className="w-[360px] border-l border-border/50 bg-card/50 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm" style={{ fontWeight: 600 }}>AI Coach</span>
              </div>
              <button
                onClick={() => navigate("/app/coach")}
                className="text-xs text-primary hover:text-primary/80"
              >
                Full View
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-secondary/40 border border-border/50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-neon-orange" />
                  <span className="text-xs text-neon-orange" style={{ fontWeight: 600 }}>Quick Hint</span>
                </div>
                <p className="text-xs text-foreground/80" style={{ lineHeight: 1.6 }}>
                  Think about how to model the friendship constraints as a graph. What type of graph problem does this become?
                </p>
              </div>
              <div className="bg-secondary/40 border border-border/50 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-neon-cyan" />
                  <span className="text-xs text-neon-cyan" style={{ fontWeight: 600 }}>Key Concept</span>
                </div>
                <p className="text-xs text-foreground/80" style={{ lineHeight: 1.6 }}>
                  This problem involves graph coloring and bipartite checking. Review these concepts if needed.
                </p>
              </div>
            </div>

            <div className="p-3 border-t border-border/50 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  placeholder="Ask for a hint..."
                  className="flex-1 px-3 py-2 text-xs bg-secondary/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                />
                <button className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
