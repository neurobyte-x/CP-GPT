import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ExternalLink,
  Clock,
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
  Loader2,
  Sparkles,
} from 'lucide-react';

import { useProblem, useCoaching } from '@/hooks/useApi';
import type { CoachingRequest } from '@/types';

function ratingColor(r: number | null) {
  if (r === null) return 'text-muted-foreground';
  if (r < 1200) return 'text-gray-400';
  if (r < 1400) return 'text-green-400';
  if (r < 1600) return 'text-cyan-400';
  if (r < 1900) return 'text-blue-400';
  if (r < 2100) return 'text-purple-400';
  return 'text-red-400';
}

interface CoachMessage {
  type: 'hint' | 'concept' | 'approach' | 'user';
  label: string;
  content: string;
  icon: 'lightbulb' | 'book' | 'sparkles' | 'user';
  color: string;
}

export default function ProblemWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const problemId = Number(id);

  const { data: problem, isLoading, isError } = useProblem(problemId);
  const coaching = useCoaching();

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Notes state
  const [notes, setNotes] = useState('');

  // Status
  const [status, setStatus] = useState<'unsolved' | 'attempting' | 'solved'>('unsolved');

  // Coach panel
  const [showCoach, setShowCoach] = useState(false);
  const [coachInput, setCoachInput] = useState('');
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [hintLevel, setHintLevel] = useState(1);
  const coachEndRef = useRef<HTMLDivElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'statement' | 'notes' | 'editorial'>('statement');

  // Editorial reveal
  const [editorialRevealed, setEditorialRevealed] = useState(false);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Auto-scroll coach panel
  useEffect(() => {
    coachEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const sendCoachMessage = useCallback(
    async (action: CoachingRequest['action'], userContext?: string) => {
      if (!problem) return;

      // Add user message if there's context
      if (userContext) {
        setCoachMessages((prev) => [
          ...prev,
          {
            type: 'user',
            label: 'You',
            content: userContext,
            icon: 'user',
            color: 'text-foreground',
          },
        ]);
      }

      try {
        const resp = await coaching.mutateAsync({
          problem_id: problem.id,
          action,
          hint_level: hintLevel,
          user_context: userContext,
        });

        const iconMap: Record<string, CoachMessage['icon']> = {
          hint: 'lightbulb',
          explain: 'book',
          approach: 'sparkles',
          pitfalls: 'lightbulb',
          analyze: 'book',
          solution: 'sparkles',
        };

        const colorMap: Record<string, string> = {
          hint: 'text-neon-orange',
          explain: 'text-neon-cyan',
          approach: 'text-neon-purple',
          pitfalls: 'text-neon-orange',
          analyze: 'text-neon-cyan',
          solution: 'text-neon-green',
        };

        setCoachMessages((prev) => [
          ...prev,
          {
            type: action === 'hint' ? 'hint' : 'concept',
            label: action.charAt(0).toUpperCase() + action.slice(1),
            content: resp.response,
            icon: iconMap[action] || 'sparkles',
            color: colorMap[action] || 'text-primary',
          },
        ]);

        if (action === 'hint') {
          setHintLevel((l) => Math.min(l + 1, 5));
        }
      } catch {
        setCoachMessages((prev) => [
          ...prev,
          {
            type: 'concept',
            label: 'Error',
            content: 'Failed to get coaching response. Please try again.',
            icon: 'lightbulb',
            color: 'text-destructive',
          },
        ]);
      }
    },
    [problem, coaching, hintLevel],
  );

  const handleCoachSubmit = () => {
    if (!coachInput.trim()) return;
    sendCoachMessage('hint', coachInput.trim());
    setCoachInput('');
  };

  // ── Loading / Error states ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !problem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-muted-foreground">Problem not found.</p>
        <button
          onClick={() => navigate('/app/problems')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Back to Problems
        </button>
      </div>
    );
  }

  const cfProblemId = `${problem.contest_id}${problem.problem_index}`;
  const cfUrl = problem.url || `https://codeforces.com/problemset/problem/${problem.contest_id}/${problem.problem_index}`;

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
                <h2 className="text-sm font-semibold truncate">
                  CF {cfProblemId} — {problem.name}
                </h2>
                {problem.rating && (
                  <span
                    className={`text-xs font-bold ${ratingColor(problem.rating)}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {problem.rating}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {problem.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-accent rounded"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Timer */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span
                className="text-sm font-semibold"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {formatTime(timerSeconds)}
              </span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setTimerSeconds(0);
                  setTimerRunning(false);
                }}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'unsolved' | 'attempting' | 'solved')}
              className="px-3 py-1.5 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none cursor-pointer"
            >
              <option value="unsolved">Unsolved</option>
              <option value="attempting">Attempting</option>
              <option value="solved">Solved</option>
            </select>

            <a
              href={cfUrl}
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
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-accent'
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
              { key: 'statement' as const, label: 'Problem', icon: FileText },
              { key: 'notes' as const, label: 'Notes', icon: BookOpen },
              { key: 'editorial' as const, label: 'Editorial', icon: Eye },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-primary border-primary font-semibold'
                    : 'text-muted-foreground border-transparent hover:text-foreground font-normal'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {activeTab === 'statement' && (
              <div className="max-w-3xl space-y-6">
                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {problem.contest_name || `Contest ${problem.contest_id}`}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {problem.solved_count.toLocaleString()} solves
                  </div>
                  {problem.contest_type && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {problem.contest_type}
                    </div>
                  )}
                </div>

                {/* Problem info card */}
                <div className="bg-secondary/30 border border-border/50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-foreground/90" style={{ lineHeight: 1.8 }}>
                    This problem is from{' '}
                    <span className="font-medium">{problem.contest_name || `Contest ${problem.contest_id}`}</span>
                    {problem.rating && (
                      <>
                        {' '}and is rated{' '}
                        <span className={`font-bold ${ratingColor(problem.rating)}`}>
                          {problem.rating}
                        </span>
                      </>
                    )}
                    . It has been solved by{' '}
                    <span className="font-medium">{problem.solved_count.toLocaleString()}</span> users.
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <span
                        key={tag.slug}
                        className="text-xs text-muted-foreground px-2 py-0.5 bg-accent rounded"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Link to Codeforces for full statement */}
                <div className="bg-secondary/30 border border-border/50 rounded-lg p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-1">View Full Problem Statement</h4>
                    <p className="text-xs text-muted-foreground">
                      Read the complete problem statement with examples, input/output format, and constraints on Codeforces.
                    </p>
                  </div>
                  <a
                    href={cfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open on Codeforces
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
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

            {activeTab === 'editorial' && (
              <div className="max-w-3xl">
                {!editorialRevealed ? (
                  <div className="flex items-center gap-3 p-6 bg-secondary/30 border border-border/50 rounded-lg">
                    <Eye className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-semibold mb-1">Editorial Hidden</h4>
                      <p className="text-xs text-muted-foreground">
                        Try solving the problem first, or ask the AI Coach for progressive hints.
                      </p>
                      <button
                        onClick={() => {
                          setEditorialRevealed(true);
                          sendCoachMessage('solution');
                        }}
                        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neon-purple/30 text-neon-purple rounded-lg hover:bg-neon-purple/5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Reveal Editorial
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary/30 border border-border/50 rounded-lg p-6">
                    {coaching.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Loading editorial...</span>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none">
                        {coachMessages
                          .filter((m) => m.type !== 'user')
                          .slice(-1)
                          .map((m, i) => (
                            <div key={i} className="text-sm text-foreground/90 whitespace-pre-wrap" style={{ lineHeight: 1.8 }}>
                              {m.content}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
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
                <span className="text-sm font-semibold">AI Coach</span>
              </div>
              <button
                onClick={() => navigate('/app/coach')}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Full View
              </button>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3 border-b border-border/50 flex flex-wrap gap-1.5 shrink-0">
              {[
                { label: 'Hint', action: 'hint' as const },
                { label: 'Explain', action: 'explain' as const },
                { label: 'Approach', action: 'approach' as const },
                { label: 'Pitfalls', action: 'pitfalls' as const },
              ].map((btn) => (
                <button
                  key={btn.action}
                  onClick={() => sendCoachMessage(btn.action)}
                  disabled={coaching.isPending}
                  className="px-2.5 py-1 text-[10px] rounded-md bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {coachMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Sparkles className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-xs text-muted-foreground">
                    Ask the AI Coach for hints, explanations, or approach guidance.
                  </p>
                </div>
              )}

              {coachMessages.map((msg, i) => {
                if (msg.type === 'user') {
                  return (
                    <div key={i} className="bg-primary/15 border border-primary/20 rounded-xl px-3 py-2.5">
                      <p className="text-xs text-foreground/90" style={{ lineHeight: 1.6 }}>
                        {msg.content}
                      </p>
                    </div>
                  );
                }

                const IconComponent =
                  msg.icon === 'lightbulb' ? Lightbulb :
                  msg.icon === 'book' ? BookOpen :
                  Sparkles;

                return (
                  <div key={i} className="bg-secondary/40 border border-border/50 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <IconComponent className={`w-3.5 h-3.5 ${msg.color}`} />
                      <span className={`text-xs font-semibold ${msg.color}`}>{msg.label}</span>
                    </div>
                    <p
                      className="text-xs text-foreground/80 whitespace-pre-wrap"
                      style={{ lineHeight: 1.6 }}
                    >
                      {msg.content}
                    </p>
                  </div>
                );
              })}

              {coaching.isPending && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              )}

              <div ref={coachEndRef} />
            </div>

            <div className="p-3 border-t border-border/50 shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coachInput}
                  onChange={(e) => setCoachInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCoachSubmit();
                    }
                  }}
                  placeholder="Ask for a hint..."
                  className="flex-1 px-3 py-2 text-xs bg-secondary/60 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
                />
                <button
                  onClick={handleCoachSubmit}
                  disabled={!coachInput.trim() || coaching.isPending}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
