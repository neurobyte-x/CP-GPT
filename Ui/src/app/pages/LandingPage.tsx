import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Brain,
  Zap,
  Target,
  BarChart3,
  Code2,
  ChevronRight,
  Star,
  Users,
  Trophy,
  ArrowRight,
  Sparkles,
  Github,
  Twitter,
  MessageSquare,
  Menu,
  X,
  Send,
  CheckCircle2,
  TrendingUp,
  Flame,
  Clock,
  Lightbulb,
  Route,
  Shield,
  CircleDot,
  Play,
  ArrowUpRight,
  Check,
  Minus,
  BookOpen,
  Award,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "motion/react";

// ─── Animated Background ─────────────────────────────────────
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 30%, black 30%, transparent 100%)",
        }}
      />
      {/* Glows */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(ellipse,rgba(255,255,255,0.03)_0%,transparent_60%)]" />
      <div className="absolute top-[10%] left-[-10%] w-[700px] h-[700px] bg-[radial-gradient(ellipse,rgba(255,255,255,0.02)_0%,transparent_60%)]" />
      <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(255,255,255,0.015)_0%,transparent_60%)]" />
      {/* Floating particles */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            background: ["#ffffff", "#a0a0a0", "#d4d4d4", "#737373", "#e5e5e5"][i % 5],
            opacity: 0.12 + Math.random() * 0.15,
          }}
          animate={{
            y: [0, -(20 + Math.random() * 40), 0],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5 + Math.random() * 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

// ─── Animated Counter ────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numericValue = parseInt(target.replace(/[^0-9]/g, ""));

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = numericValue / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, numericValue]);

  const formatted = target.includes(",")
    ? count.toLocaleString()
    : count.toString();

  return (
    <div ref={ref}>
      {formatted}
      {suffix}
    </div>
  );
}

// ─── Typewriter Terminal ─────────────────────────────────────
const terminalLines = [
  { type: "prompt", text: "$ cpcoach solve --topic graphs --rating 1700" },
  { type: "system", text: "🔍 Analyzing your skill profile..." },
  { type: "system", text: "📊 Graph mastery: 72% | Weak: SCC, Bridges" },
  { type: "system", text: "🎯 Selected: CF 1842D — Tenzing and His Animal Friends" },
  { type: "blank", text: "" },
  { type: "coach", text: "🧠 AI Coach: This problem uses graph coloring. Here's your approach:" },
  { type: "hint", text: "   Hint 1: Model friendships as edges in an undirected graph" },
  { type: "hint", text: "   Hint 2: Check bipartiteness using BFS coloring" },
  { type: "hint", text: "   Hint 3: Handle disconnected components separately" },
  { type: "blank", text: "" },
  { type: "success", text: "✅ Solution accepted! Rating: 1700 → 1725 (+25)" },
  { type: "success", text: "🔥 Streak extended: 8 days" },
];

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const currentLine = terminalLines[visibleLines];

  useEffect(() => {
    if (visibleLines >= terminalLines.length) {
      // Reset after a pause
      const timeout = setTimeout(() => {
        setVisibleLines(0);
        setCharIndex(0);
      }, 4000);
      return () => clearTimeout(timeout);
    }

    if (currentLine?.type === "blank") {
      const timeout = setTimeout(() => {
        setVisibleLines((v) => v + 1);
        setCharIndex(0);
      }, 300);
      return () => clearTimeout(timeout);
    }

    if (charIndex < (currentLine?.text.length || 0)) {
      const speed = currentLine?.type === "prompt" ? 30 : 12;
      const timeout = setTimeout(() => setCharIndex((c) => c + 1), speed);
      return () => clearTimeout(timeout);
    } else {
      const delay = currentLine?.type === "prompt" ? 600 : 350;
      const timeout = setTimeout(() => {
        setVisibleLines((v) => v + 1);
        setCharIndex(0);
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [visibleLines, charIndex, currentLine]);

  const lineColor = (type: string) => {
    switch (type) {
      case "prompt": return "text-neon-green";
      case "system": return "text-muted-foreground";
      case "coach": return "text-primary";
      case "hint": return "text-neon-cyan";
      case "success": return "text-neon-green";
      default: return "text-foreground";
    }
  };

  return (
    <div className="bg-[#060606] border border-border/60 rounded-2xl overflow-hidden shadow-2xl shadow-white/[0.02]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-[#0a0a0a]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          cpcoach — ai-session
        </span>
        <div className="w-12" />
      </div>
      <div className="p-5 min-h-[280px] lg:min-h-[320px] bg-[#060606]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`text-[13px] ${lineColor(line.type)}`} style={{ lineHeight: 2 }}>
            {line.text}
          </div>
        ))}
        {visibleLines < terminalLines.length && currentLine?.type !== "blank" && (
          <div className={`text-[13px] ${lineColor(currentLine?.type || "")}`} style={{ lineHeight: 2 }}>
            {currentLine?.text.slice(0, charIndex)}
            <span className="inline-block w-[7px] h-[15px] bg-primary ml-[1px] animate-pulse align-middle" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Interactive Chat Demo ───────────────────────────────────
const demoQuestions = [
  { q: "How do I detect cycles in a directed graph?", a: "Use DFS with 3-color marking (white/gray/black). A cycle exists when you visit a gray node. Gray means the node is currently being processed in the DFS stack — encountering it again means you've found a back edge." },
  { q: "When should I use Dijkstra vs BFS?", a: "Use BFS for unweighted graphs (all edges weight 1). Use Dijkstra when edges have different non-negative weights. For negative weights, use Bellman-Ford. Dijkstra is O((V+E)logV) with a priority queue." },
  { q: "Explain the two-pointer technique", a: "Two pointers maintain a window/range over sorted data. Start both at one end (or one at each end), then move them based on conditions. Classic examples: finding pairs that sum to target, sliding window for subarray problems. O(n) time." },
  { q: "What's the key insight for segment trees?", a: "Segment trees store aggregate info (sum, min, max) over array ranges. Each node covers a range, children split it in half. Build O(n), query/update O(log n). Use lazy propagation for range updates. Essential for 1600+ rated problems." },
];

function InteractiveChatDemo() {
  const [selectedQ, setSelectedQ] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSelect = (idx: number) => {
    if (typing) return;
    setSelectedQ(idx);
    setShowAnswer(false);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setShowAnswer(true);
    }, 1200);
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-3 bg-secondary/30">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>AI Coach — Live Preview</div>
          <div className="text-[11px] text-neon-green flex items-center gap-1">
            <CircleDot className="w-3 h-3" /> Online
          </div>
        </div>
        <div className="ml-auto px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded" style={{ fontWeight: 600 }}>
          INTERACTIVE
        </div>
      </div>

      {/* Chat area */}
      <div className="p-5 min-h-[220px] space-y-4">
        {selectedQ !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <div className="bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
              <p className="text-sm">{demoQuestions[selectedQ].q}</p>
            </div>
          </motion.div>
        )}
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-3 bg-secondary/40 border border-border/30 rounded-2xl rounded-bl-md max-w-[80%]">
            <Sparkles className="w-4 h-4 text-primary" />
            <div className="flex gap-1">
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-primary rounded-full" />
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-primary rounded-full" />
              <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-primary rounded-full" />
            </div>
          </motion.div>
        )}
        {showAnswer && selectedQ !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-secondary/40 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] text-primary" style={{ fontWeight: 600 }}>AI Coach</span>
              </div>
              <p className="text-sm text-foreground/90" style={{ lineHeight: 1.7 }}>
                {demoQuestions[selectedQ].a}
              </p>
            </div>
          </motion.div>
        )}
        {selectedQ === null && (
          <div className="flex items-center justify-center h-[180px] text-muted-foreground text-sm">
            <div className="text-center">
              <Brain className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p>Click a question below to see the AI Coach in action</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick questions */}
      <div className="px-5 pb-5 space-y-2">
        <p className="text-[11px] text-muted-foreground" style={{ fontWeight: 500 }}>TRY ASKING:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {demoQuestions.map((dq, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`text-left px-3 py-2.5 text-xs rounded-lg border transition-all ${
                selectedQ === i
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20"
              }`}
              style={{ lineHeight: 1.5 }}
            >
              {dq.q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Animated Rating Graph ───────────────────────────────────
function RatingGraph() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const timer = setInterval(() => {
      start += 0.015;
      if (start >= 1) {
        setProgress(1);
        clearInterval(timer);
      } else {
        setProgress(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView]);

  const dataPoints = [
    { month: 0, rating: 1200 },
    { month: 1, rating: 1250 },
    { month: 2, rating: 1320 },
    { month: 3, rating: 1280 },
    { month: 4, rating: 1400 },
    { month: 5, rating: 1450 },
    { month: 6, rating: 1520 },
    { month: 7, rating: 1580 },
    { month: 8, rating: 1550 },
    { month: 9, rating: 1650 },
    { month: 10, rating: 1720 },
    { month: 11, rating: 1780 },
    { month: 12, rating: 1850 },
    { month: 13, rating: 1900 },
    { month: 14, rating: 1920 },
  ];

  const milestones = [
    { month: 0, label: "Joined", rating: 1200, color: "#71717a" },
    { month: 4, label: "Specialist", rating: 1400, color: "#22d3ee" },
    { month: 9, label: "Expert", rating: 1650, color: "#3b82f6" },
    { month: 14, label: "Today", rating: 1920, color: "#a855f7" },
  ];

  const w = 600, h = 200;
  const padding = { top: 20, bottom: 30, left: 10, right: 10 };
  const minR = 1100, maxR = 2000;
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  const toX = (m: number) => padding.left + (m / 14) * chartW;
  const toY = (r: number) => padding.top + chartH - ((r - minR) / (maxR - minR)) * chartH;

  const totalPoints = Math.max(1, Math.floor(progress * dataPoints.length));
  const visiblePoints = dataPoints.slice(0, totalPoints);

  const linePath = visiblePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.month)} ${toY(p.rating)}`)
    .join(" ");

  const areaPath = linePath +
    ` L ${toX(visiblePoints[visiblePoints.length - 1]?.month || 0)} ${toY(minR)}` +
    ` L ${toX(0)} ${toY(minR)} Z`;

  const lastPoint = visiblePoints[visiblePoints.length - 1];

  // Rating bands
  const bands = [
    { min: 1100, max: 1200, color: "rgba(107,114,128,0.06)", label: "Newbie" },
    { min: 1200, max: 1400, color: "rgba(34,197,94,0.04)", label: "Pupil" },
    { min: 1400, max: 1600, color: "rgba(34,211,238,0.04)", label: "Specialist" },
    { min: 1600, max: 1900, color: "rgba(59,130,246,0.04)", label: "Expert" },
    { min: 1900, max: 2000, color: "rgba(168,85,247,0.04)", label: "CM" },
  ];

  return (
    <div ref={ref} className="bg-card border border-border rounded-2xl p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm" style={{ fontWeight: 600 }}>Rating Progression with CPCoach</div>
          <div className="text-xs text-muted-foreground mt-0.5">Real user trajectory over 14 months</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neon-green/10 border border-neon-green/20">
            <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
            <span className="text-xs text-neon-green" style={{ fontWeight: 700 }}>+720</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rating bands */}
        {bands.map((b) => (
          <g key={b.label}>
            <rect
              x={padding.left}
              y={toY(b.max)}
              width={chartW}
              height={toY(b.min) - toY(b.max)}
              fill={b.color}
            />
            <text
              x={w - padding.right - 4}
              y={toY((b.min + b.max) / 2) + 3}
              textAnchor="end"
              fill="#71717a"
              fontSize="9"
              opacity="0.5"
              fontFamily="Inter, sans-serif"
            >
              {b.label}
            </text>
          </g>
        ))}

        {/* Horizontal guides */}
        {[1200, 1400, 1600, 1900].map((r) => (
          <line
            key={r}
            x1={padding.left}
            y1={toY(r)}
            x2={w - padding.right}
            y2={toY(r)}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        {visiblePoints.length > 1 && (
          <path d={areaPath} fill="url(#ratingGrad)" />
        )}

        {/* Line */}
        {visiblePoints.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
        )}

        {/* Current point glow */}
        {lastPoint && (
          <>
            <circle cx={toX(lastPoint.month)} cy={toY(lastPoint.rating)} r="8" fill="#ffffff" opacity="0.15" />
            <circle cx={toX(lastPoint.month)} cy={toY(lastPoint.rating)} r="4" fill="#ffffff" />
            <circle cx={toX(lastPoint.month)} cy={toY(lastPoint.rating)} r="2" fill="#fff" />
          </>
        )}

        {/* Milestones */}
        {milestones.map((m) => {
          if (m.month > (lastPoint?.month || 0)) return null;
          return (
            <g key={m.label}>
              <line
                x1={toX(m.month)}
                y1={toY(m.rating) + 6}
                x2={toX(m.month)}
                y2={h - padding.bottom}
                stroke={m.color}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <text
                x={toX(m.month)}
                y={h - 8}
                textAnchor="middle"
                fill={m.color}
                fontSize="10"
                fontFamily="Inter, sans-serif"
                fontWeight="600"
              >
                {m.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Rating badges */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
        {[
          { label: "Starting", value: "1,200", color: "text-gray-400" },
          { label: "3 Months", value: "1,400", color: "text-cyan-400" },
          { label: "9 Months", value: "1,650", color: "text-blue-400" },
          { label: "Current", value: "1,920", color: "text-purple-400" },
        ].map((b) => (
          <div key={b.label} className="text-center">
            <div className={`text-sm ${b.color}`} style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              {b.value}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── How It Works ────────────────────────────────────────────
const howItWorks = [
  {
    step: "01",
    icon: Target,
    title: "AI Analyzes Your Profile",
    desc: "Connect your Codeforces handle. Our AI maps your solved problems, identifies gaps across 40+ algorithmic topics, and builds your skill profile.",
    color: "text-neon-cyan",
    glow: "shadow-neon-cyan/10",
    visual: (
      <div className="space-y-2.5 mt-4">
        {[
          { topic: "Binary Search", pct: 92, color: "bg-neon-green" },
          { topic: "Graph Theory", pct: 65, color: "bg-neon-blue" },
          { topic: "Dynamic Prog.", pct: 31, color: "bg-red-500" },
          { topic: "Number Theory", pct: 48, color: "bg-neon-orange" },
        ].map((t) => (
          <div key={t.topic} className="flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground w-24 shrink-0">{t.topic}</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${t.color} rounded-full`}
                initial={{ width: 0 }}
                whileInView={{ width: `${t.pct}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                viewport={{ once: true }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground w-8 text-right" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {t.pct}%
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: "02",
    icon: Route,
    title: "Follow Your Custom Path",
    desc: "Get a personalized practice sequence targeting your weak areas. Each problem is hand-picked from Codeforces at the perfect difficulty stretch.",
    color: "text-neon-purple",
    glow: "shadow-neon-purple/10",
    visual: (
      <div className="space-y-2 mt-4">
        {[
          { title: "DP on Trees", rating: 1600, status: "solved", statusColor: "text-neon-green" },
          { title: "Bitmask DP", rating: 1700, status: "current", statusColor: "text-primary" },
          { title: "Digit DP", rating: 1800, status: "locked", statusColor: "text-muted-foreground/40" },
        ].map((p) => (
          <div key={p.title} className="flex items-center gap-3 px-3 py-2 bg-secondary/30 rounded-lg border border-border/30">
            {p.status === "solved" ? (
              <CheckCircle2 className="w-4 h-4 text-neon-green shrink-0" />
            ) : p.status === "current" ? (
              <Play className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            )}
            <span className="text-xs flex-1" style={{ fontWeight: 500 }}>{p.title}</span>
            <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.rating}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    step: "03",
    icon: Brain,
    title: "Coach Guides You to Mastery",
    desc: "Get progressive hints, not answers. The AI adapts its coaching depth to your level — from gentle nudges for near-solutions to full concept breakdowns.",
    color: "text-neon-green",
    glow: "shadow-neon-green/10",
    visual: (
      <div className="space-y-2 mt-4">
        {[
          { level: "Hint 1", text: "Think about what data structure allows O(log n) range queries", intensity: "bg-neon-green/10 border-neon-green/20 text-neon-green" },
          { level: "Hint 2", text: "Consider a segment tree with lazy propagation", intensity: "bg-neon-orange/10 border-neon-orange/20 text-neon-orange" },
          { level: "Hint 3", text: "Build the tree bottom-up, merge intervals at each node", intensity: "bg-red-500/10 border-red-500/20 text-red-400" },
        ].map((h) => (
          <div key={h.level} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${h.intensity}`}>
            <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px]" style={{ fontWeight: 700 }}>{h.level}</span>
              <p className="text-[11px] opacity-80 mt-0.5" style={{ lineHeight: 1.4 }}>{h.text}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

// ─── Comparison Table ────────────────────────────────────────
const comparisonRows = [
  { feature: "Personalized problem selection", us: true, them: false },
  { feature: "AI coaching conversations", us: true, them: false },
  { feature: "Progressive hint system", us: true, them: false },
  { feature: "Codeforces integration", us: true, them: "partial" },
  { feature: "Structured learning paths", us: true, them: "partial" },
  { feature: "Weak area detection", us: true, them: false },
  { feature: "Rating progression tracking", us: true, them: true },
  { feature: "Spaced repetition", us: true, them: false },
];

// ─── Features Data ───────────────────────────────────────────
const features = [
  { icon: Brain, title: "AI-Powered Coaching", description: "Context-aware coaching that adapts to your skill level with progressive hints and concept explanations.", color: "text-neon-purple", bg: "bg-neon-purple/10", border: "border-neon-purple/20" },
  { icon: Target, title: "Structured Practice Paths", description: "Curated learning paths from beginner to expert targeting specific algorithms with progressive difficulty.", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/20" },
  { icon: Zap, title: "Autonomous Problem Selection", description: "Our AI picks the perfect next problem from Codeforces based on your weaknesses and learning goals.", color: "text-neon-orange", bg: "bg-neon-orange/10", border: "border-neon-orange/20" },
  { icon: BarChart3, title: "Deep Progress Analytics", description: "Track growth across topics, difficulty levels, and time. Identify weak areas and watch your rating climb.", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/20" },
  { icon: Code2, title: "Codeforces Integration", description: "Pull problems, track submissions, and sync your profile for a seamless unified experience.", color: "text-neon-cyan", bg: "bg-neon-cyan/10", border: "border-neon-cyan/20" },
  { icon: Sparkles, title: "Concept Mastery Engine", description: "Master each concept through spaced repetition and intelligent sequencing until true understanding.", color: "text-neon-pink", bg: "bg-neon-pink/10", border: "border-neon-pink/20" },
];

const stats = [
  { value: "2400", suffix: "+", label: "Curated Problems", icon: Code2 },
  { value: "15000", suffix: "+", label: "Active Learners", icon: Users },
  { value: "89", suffix: "%", label: "Improvement Rate", icon: Trophy },
  { value: "720", suffix: "+", label: "Avg Rating Gain", icon: TrendingUp },
];

const testimonials = [
  { name: "Alex Chen", handle: "@alex_cp", rating: "Expert (1847)", ratingColor: "text-blue-400", text: "Went from 1200 to 1800+ in 3 months. The AI coach identified my DP weakness and built a custom path that actually worked. Nothing else comes close.", avatar: "AC" },
  { name: "Priya Sharma", handle: "@priya_codes", rating: "CM (2100)", ratingColor: "text-purple-400", text: "The structured practice paths are incredible. Every problem feels intentionally placed. I stopped wasting time on random practice and started improving consistently.", avatar: "PS" },
  { name: "Marcus Johnson", handle: "@mj_competitive", rating: "Expert (1956)", ratingColor: "text-blue-400", text: "Finally, a platform that doesn't just give you problems but teaches you HOW to think. The coaching conversations feel like talking to a grandmaster tutor.", avatar: "MJ" },
  { name: "Yuki Tanaka", handle: "@yuki_algo", rating: "Expert (1780)", ratingColor: "text-blue-400", text: "The progressive hint system is genius. Instead of spoiling solutions, it nudges me just enough to figure things out myself. My contest performance skyrocketed.", avatar: "YT" },
];

// ─── Main Component ─────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg" style={{ fontWeight: 700 }}>
                CPCoach<span className="text-primary">.ai</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {["Features", "Demo", "Results", "Testimonials"].map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/app")} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate("/app")} className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Get Started Free
              </button>
            </div>
            <button className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {["Features", "Demo", "Results"].map((l) => (
                  <a key={l} href={`#${l.toLowerCase()}`} className="block text-sm text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>{l}</a>
                ))}
                <button onClick={() => navigate("/app")} className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg">
                  Get Started Free
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative pt-28 pb-8 lg:pt-40 lg:pb-12">
        <HeroBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>AI-Powered Coaching Engine</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 rounded" style={{ fontWeight: 700 }}>NEW</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6" style={{ fontWeight: 800, lineHeight: 1.08 }}>
                  Train Smarter.{" "}
                  <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                    Rank Higher.
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl mb-8" style={{ lineHeight: 1.75 }}>
                  Your autonomous AI coach analyzes your Codeforces profile, builds custom practice paths, and guides you through each problem with progressive hints — not answers.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="flex flex-col sm:flex-row gap-3 mb-8">
                <button
                  onClick={() => navigate("/app/coach")}
                  className="group flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(255,255,255,0.25)]"
                >
                  <Zap className="w-5 h-5" />
                  Launch AI Coach
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a href="#demo" className="flex items-center justify-center gap-2 px-7 py-3.5 border border-border rounded-xl text-foreground hover:bg-accent/50 transition-all">
                  <Play className="w-4 h-4" />
                  See Live Demo
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["bg-gradient-to-br from-primary to-neon-purple", "bg-gradient-to-br from-neon-cyan to-neon-blue", "bg-gradient-to-br from-neon-green to-neon-cyan", "bg-gradient-to-br from-neon-orange to-neon-pink"].map((bg, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-background flex items-center justify-center`}>
                        <span className="text-[9px] text-white" style={{ fontWeight: 700 }}>{["AC", "PS", "MJ", "YT"][i]}</span>
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    <span className="text-foreground" style={{ fontWeight: 600 }}>15K+</span> active users
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-neon-orange text-neon-orange" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">4.9/5 rating</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Terminal */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-white/[0.06] rounded-3xl blur-xl" />
                <div className="relative">
                  <AnimatedTerminal />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Logos / Trust ──────────────────────────────────── */}
      <section className="py-12 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground mb-6 uppercase tracking-widest">
            Built for competitive programmers on
          </p>
          <div className="flex items-center justify-center gap-8 lg:gap-14 flex-wrap opacity-50">
            {[
              { name: "Codeforces", icon: "CF" },
              { name: "ICPC", icon: "ICPC" },
              { name: "IOI", icon: "IOI" },
              { name: "Google Code Jam", icon: "GCJ" },
              { name: "AtCoder", icon: "AC" },
              { name: "USACO", icon: "USA" },
            ].map((l) => (
              <div key={l.name} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
                  <span className="text-[8px] text-foreground" style={{ fontWeight: 800 }}>{l.icon}</span>
                </div>
                <span className="text-sm text-foreground" style={{ fontWeight: 600 }}>{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats (Animated Counters) ─────────────────────── */}
      <section id="results" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl lg:text-4xl text-foreground mb-1" style={{ fontWeight: 800 }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-orange/30 bg-neon-orange/5 text-neon-orange text-xs mb-4" style={{ fontWeight: 600 }}>
              HOW IT WORKS
            </div>
            <h2 className="text-3xl lg:text-4xl mb-4" style={{ fontWeight: 700 }}>
              Three steps to{" "}
              <span className="bg-gradient-to-r from-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                consistent improvement
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No more random grinding. Our AI creates a systematic training plan that adapts in real-time.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl text-foreground/10" style={{ fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}>
                    {step.step}
                  </span>
                  <div className={`w-9 h-9 rounded-lg bg-opacity-10 flex items-center justify-center ${step.color.replace("text-", "bg-")}/10`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                </div>
                <h3 className="text-base mb-2" style={{ fontWeight: 600 }}>{step.title}</h3>
                <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>{step.desc}</p>
                {step.visual}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Interactive Demo ──────────────────────────────── */}
      <section id="demo" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs mb-4" style={{ fontWeight: 600 }}>
                LIVE DEMO
              </div>
              <h2 className="text-3xl lg:text-4xl mb-4" style={{ fontWeight: 700 }}>
                Experience the{" "}
                <span className="text-primary">AI Coach</span>
              </h2>
              <p className="text-muted-foreground mb-8" style={{ lineHeight: 1.7 }}>
                Click any question to see how the AI Coach responds. In the real app, you can have full multi-turn conversations about any problem or concept.
              </p>

              <InteractiveChatDemo />
            </div>

            <div className="space-y-6">
              {/* Rating Graph */}
              <RatingGraph />

              {/* Mini dashboard preview */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="text-sm mb-4" style={{ fontWeight: 600 }}>Dashboard Preview</div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Streak", value: "14d", icon: Flame, color: "text-neon-orange", bg: "bg-neon-orange/10" },
                    { label: "Solved", value: "342", icon: CheckCircle2, color: "text-neon-green", bg: "bg-neon-green/10" },
                    { label: "Rank", value: "Top 5%", icon: Award, color: "text-neon-purple", bg: "bg-neon-purple/10" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} border border-border/30 rounded-xl p-3 text-center`}>
                      <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-1.5`} />
                      <div className="text-sm" style={{ fontWeight: 700 }}>{s.value}</div>
                      <div className="text-[10px] text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate("/app")}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary/20 transition-all"
                >
                  Try Full Dashboard
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section id="features" className="py-24 bg-secondary/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 text-neon-cyan text-xs mb-4" style={{ fontWeight: 600 }}>
              FEATURES
            </div>
            <h2 className="text-3xl lg:text-4xl mb-4" style={{ fontWeight: 700 }}>
              Everything you need to{" "}
              <span className="text-primary">level up</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete competitive programming training platform designed for serious, measurable improvement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                viewport={{ once: true }}
                className={`group relative p-6 rounded-xl border ${feature.border} bg-card hover:bg-accent/20 transition-all hover:-translate-y-1 overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition-opacity`} />
                <div className="relative">
                  <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="text-base mb-2" style={{ fontWeight: 600 }}>{feature.title}</h3>
                  <p className="text-sm text-muted-foreground" style={{ lineHeight: 1.7 }}>{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ──────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-purple/30 bg-neon-purple/5 text-neon-purple text-xs mb-4" style={{ fontWeight: 600 }}>
              WHY US
            </div>
            <h2 className="text-3xl lg:text-4xl mb-4" style={{ fontWeight: 700 }}>
              CPCoach vs{" "}
              <span className="text-muted-foreground">Traditional Practice</span>
            </h2>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_140px_140px] border-b border-border">
              <div className="px-5 py-3.5 text-xs text-muted-foreground">Feature</div>
              <div className="px-3 py-3.5 text-center border-l border-border bg-primary/5">
                <span className="text-xs text-primary" style={{ fontWeight: 700 }}>Cp-GPT</span>
              </div>
              <div className="px-3 py-3.5 text-center border-l border-border">
                <span className="text-xs text-muted-foreground" style={{ fontWeight: 500 }}>Others</span>
              </div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1fr_120px_120px] sm:grid-cols-[1fr_140px_140px] ${
                  i < comparisonRows.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="px-5 py-3 text-sm">{row.feature}</div>
                <div className="px-3 py-3 flex items-center justify-center border-l border-border/50 bg-primary/5">
                  {row.us === true && <Check className="w-4.5 h-4.5 text-neon-green" />}
                </div>
                <div className="px-3 py-3 flex items-center justify-center border-l border-border/50">
                  {row.them === true && <Check className="w-4 h-4 text-muted-foreground" />}
                  {row.them === false && <X className="w-4 h-4 text-muted-foreground/30" />}
                  {row.them === "partial" && <Minus className="w-4 h-4 text-muted-foreground/50" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-secondary/20 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-green/30 bg-neon-green/5 text-neon-green text-xs mb-4" style={{ fontWeight: 600 }}>
              TESTIMONIALS
            </div>
            <h2 className="text-3xl lg:text-4xl mb-4" style={{ fontWeight: 700 }}>
              Trusted by{" "}
              <span className="bg-gradient-to-r from-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                competitive programmers
              </span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-neon-orange text-neon-orange" />
                  ))}
                </div>
                <p className="text-sm text-foreground/90 mb-5" style={{ lineHeight: 1.7 }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-neon-purple flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-white" style={{ fontWeight: 700 }}>{t.avatar}</span>
                  </div>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.handle} · <span className={t.ratingColor}>{t.rating}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse,rgba(255,255,255,0.025)_0%,transparent_60%)]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-6">
              <Flame className="w-4 h-4" />
              Join 15,000+ competitive programmers
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl mb-6" style={{ fontWeight: 800, lineHeight: 1.1 }}>
              Stop grinding randomly.{" "}
              <br className="hidden sm:block" />
              Start training{" "}
              <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
                intelligently
              </span>.
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto" style={{ lineHeight: 1.7 }}>
              Your next rating milestone is closer than you think. Let an AI coach that understands competitive programming guide you there.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate("/app")}
                className="group flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              >
                <Zap className="w-5 h-5" />
                Start Training Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-sm text-muted-foreground">No credit card required</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-foreground" />
                </div>
                <span style={{ fontWeight: 700 }}>
                  CPCoach<span className="text-primary">.ai</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs" style={{ lineHeight: 1.6 }}>
                The autonomous AI coaching platform for competitive programmers. Train smarter, rank higher.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <a href="#" className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Github className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Twitter className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><MessageSquare className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Product</h4>
              <div className="space-y-2.5">
                {["Features", "Pricing", "Changelog", "Roadmap"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Resources</h4>
              <div className="space-y-2.5">
                {["Documentation", "Blog", "Community", "API"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm mb-4" style={{ fontWeight: 600 }}>Company</h4>
              <div className="space-y-2.5">
                {["About", "Careers", "Contact", "Press"].map((l) => (
                  <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">&copy; 2026 Cp-GPT. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <a key={l} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
