import { useState, useRef, useEffect } from "react";
import {
  Send,
  Brain,
  Lightbulb,
  ExternalLink,
  Tag,
  Clock,
  CheckCircle2,
  BookOpen,
  ChevronDown,
  Sparkles,
  Code2,
  Eye,
  FileText,
  Link2,
  Copy,
  RotateCcw,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: string;
  codeBlock?: string;
  hintLevel?: number;
}

const currentProblem = {
  id: "1842D",
  title: "Tenzing and His Animal Friends",
  rating: 1700,
  tags: ["Graphs", "Greedy", "Constructive Algorithms"],
  solveCount: 4231,
  timeLimit: "1s",
  memoryLimit: "256MB",
  status: "attempting",
  contestId: 1842,
};

const relatedProblems = [
  { id: "1843C", title: "Sum in Binary Tree", rating: 1200, status: "solved" },
  { id: "1839B", title: "Cart of Drinks", rating: 1500, status: "unsolved" },
  { id: "1840E", title: "Character Blocking", rating: 1900, status: "unsolved" },
];

const conceptSummary = [
  "Graph Coloring: Assigning labels to vertices subject to constraints",
  "Greedy Choice: At each step, choose the locally optimal option",
  "Constructive: Build a valid solution step by step",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "coach",
    content:
      "Welcome! I see you're working on **CF 1842D — Tenzing and His Animal Friends**. This is a great graph problem rated 1700. Let me know how you'd like to approach it, or I can start with a high-level overview of the problem structure.",
    timestamp: "14:22",
  },
  {
    id: "2",
    role: "user",
    content: "I read the problem but I'm not sure how to model it. It mentions animals being friends and forming groups, but I can't see the graph structure.",
    timestamp: "14:23",
  },
  {
    id: "3",
    role: "coach",
    content:
      "Great question! Let me guide you step by step.\n\n**Hint Level 1 — Problem Modeling:**\n\nThink about each animal as a node. The friendship constraints define edges. The key insight is:\n\n> \"Animals that are friends must be in the same group OR different groups based on the constraint.\"\n\nThis is essentially a **graph coloring** problem. Try to think about what makes two animals incompatible for the same group.",
    timestamp: "14:24",
    hintLevel: 1,
  },
  {
    id: "4",
    role: "user",
    content: "Oh! So I should build a graph where edges represent conflicts, and then try to 2-color it?",
    timestamp: "14:25",
  },
  {
    id: "5",
    role: "coach",
    content:
      "Exactly the right direction! You're thinking about bipartiteness.\n\n**Hint Level 2 — Algorithm:**\n\nUse BFS/DFS to check if the graph is bipartite. If it is, a valid grouping exists. If not, there's no valid solution.\n\nHere's a skeleton to get you started:",
    timestamp: "14:26",
    hintLevel: 2,
    codeBlock: `def solve(n, edges):
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    
    color = [-1] * (n + 1)
    # Try BFS coloring from each unvisited node
    for start in range(1, n + 1):
        if color[start] == -1:
            # BFS here...
            pass
    
    return is_bipartite, groups`,
  },
];

function ratingColor(r: number) {
  if (r < 1200) return "text-gray-400";
  if (r < 1400) return "text-green-400";
  if (r < 1600) return "text-cyan-400";
  if (r < 1900) return "text-blue-400";
  if (r < 2100) return "text-purple-400";
  return "text-red-400";
}

function formatContent(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|> .*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} style={{ fontWeight: 600 }} className="text-foreground">
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-accent rounded text-neon-cyan text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("> ")) {
      return (
        <blockquote key={i} className="border-l-2 border-primary/40 pl-3 my-2 text-foreground/80 italic">
          {part.slice(2)}
        </blockquote>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [contextTab, setContextTab] = useState<"problem" | "notes" | "related">("problem");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate coach response
    setTimeout(() => {
      const coachMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content:
          "That's a great follow-up! Let me think about that...\n\nThe key observation here is that the **time complexity** of BFS coloring is O(V + E), which is efficient enough for the given constraints. Make sure to handle disconnected components by iterating through all nodes.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, coachMsg]);
    }, 1200);
  };

  return (
    <div className="flex h-full">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-4 lg:px-6 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm" style={{ fontWeight: 600 }}>AI Coach</h3>
              <p className="text-xs text-muted-foreground">Context: CF 1842D</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] lg:max-w-[75%] ${
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md"
                    : "bg-secondary/60 border border-border/50 rounded-2xl rounded-bl-md"
                } px-4 py-3`}
              >
                {msg.role === "coach" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs text-primary" style={{ fontWeight: 600 }}>AI Coach</span>
                    {msg.hintLevel && (
                      <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-neon-orange/10 text-neon-orange rounded border border-neon-orange/20" style={{ fontWeight: 600 }}>
                        Hint {msg.hintLevel}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-sm whitespace-pre-line" style={{ lineHeight: 1.7 }}>
                  {formatContent(msg.content)}
                </div>
                {msg.codeBlock && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-border/50">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-accent/50 border-b border-border/50">
                      <span className="text-xs text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>python</span>
                      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <pre className="p-3 text-xs text-foreground/90 overflow-x-auto bg-[#0a0a0a]" style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}>
                      {msg.codeBlock}
                    </pre>
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground/60 mt-2 text-right">{msg.timestamp}</div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 lg:px-6 py-2 flex gap-2 overflow-x-auto shrink-0">
          {["Give me a hint", "Explain the approach", "Show time complexity", "Related concepts"].map((q) => (
            <button
              key={q}
              onClick={() => {
                setInput(q);
              }}
              className="shrink-0 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 lg:px-6 py-3 border-t border-border/50 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask the AI Coach anything..."
              className="flex-1 px-4 py-2.5 text-sm bg-secondary/60 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Context Panel */}
      <div className="hidden lg:flex flex-col w-[380px] border-l border-border/50 bg-card/50 shrink-0">
        {/* Tabs */}
        <div className="flex border-b border-border/50 shrink-0">
          {[
            { key: "problem" as const, label: "Problem", icon: Code2 },
            { key: "notes" as const, label: "Notes", icon: FileText },
            { key: "related" as const, label: "Related", icon: Link2 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setContextTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs transition-colors ${
                contextTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontWeight: contextTab === tab.key ? 600 : 400 }}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {contextTab === "problem" && (
            <>
              {/* Problem Info */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">CURRENT PROBLEM</span>
                  <span className="px-2 py-0.5 text-[10px] bg-neon-orange/10 text-neon-orange rounded" style={{ fontWeight: 600 }}>
                    Attempting
                  </span>
                </div>
                <h3 className="text-sm mb-1" style={{ fontWeight: 600 }}>
                  CF {currentProblem.id} — {currentProblem.title}
                </h3>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">RATING</div>
                  <div className={`text-sm ${ratingColor(currentProblem.rating)}`} style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {currentProblem.rating}
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">SOLVED BY</div>
                  <div className="text-sm" style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {currentProblem.solveCount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">TIME</div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>{currentProblem.timeLimit}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3">
                  <div className="text-[10px] text-muted-foreground mb-1">MEMORY</div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>{currentProblem.memoryLimit}</div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="text-[10px] text-muted-foreground mb-2">TAGS</div>
                <div className="flex flex-wrap gap-1.5">
                  {currentProblem.tags.map((tag) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 text-xs bg-accent border border-border rounded-md text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
                  <ExternalLink className="w-4 h-4" />
                  Open on Codeforces
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Request Hint
                  </button>
                  <button className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Solved
                  </button>
                </div>
                <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-neon-purple/30 rounded-lg text-neon-purple/70 hover:text-neon-purple hover:bg-neon-purple/5 transition-all">
                  <Eye className="w-3.5 h-3.5" />
                  View Editorial
                </button>
              </div>

              {/* Concept Summary */}
              <div>
                <div className="text-[10px] text-muted-foreground mb-2">KEY CONCEPTS</div>
                <div className="space-y-2">
                  {conceptSummary.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80" style={{ lineHeight: 1.6 }}>
                      <BookOpen className="w-3.5 h-3.5 text-neon-cyan shrink-0 mt-0.5" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {contextTab === "notes" && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-3">PERSONAL NOTES</div>
              <textarea
                placeholder="Write your thoughts, approach ideas, or observations here..."
                className="w-full h-64 px-3 py-2.5 text-sm bg-secondary/40 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/40"
                defaultValue={`- Need to model as bipartite graph
- BFS coloring approach
- Handle disconnected components
- Check: what if graph has odd cycle?`}
                style={{ fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.8 }}
              />
              <p className="text-[10px] text-muted-foreground mt-2">Notes are saved automatically</p>
            </div>
          )}

          {contextTab === "related" && (
            <div className="space-y-3">
              <div className="text-[10px] text-muted-foreground mb-1">RELATED PROBLEMS</div>
              {relatedProblems.map((p) => (
                <div key={p.id} className="p-3 bg-secondary/40 border border-border/50 rounded-lg hover:border-primary/20 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ fontWeight: 500 }}>CF {p.id}</span>
                    <span className={`text-xs ${ratingColor(p.rating)}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                      {p.rating}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.title}</div>
                  <div className="mt-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      p.status === "solved"
                        ? "bg-neon-green/10 text-neon-green"
                        : "bg-secondary text-muted-foreground"
                    }`} style={{ fontWeight: 500 }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}