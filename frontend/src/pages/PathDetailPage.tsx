/**
 * PathDetailPage — detailed view of a practice path (dark theme).
 * Shows path header with progress, problem timeline, and inline coaching.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Check,
  SkipForward,
  Lock,
  Unlock,
  Brain,
  ExternalLink,
  Clock,
  Target,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

import { usePath, useMarkSolved, useSkipProblem, useCoaching } from '@/hooks/useApi';
import type { PathProblem, CoachingRequest, CoachingResponse } from '@/types';

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

function statusConfig(status: PathProblem['status']) {
  switch (status) {
    case 'solved':
      return { icon: CheckCircle2, color: 'text-neon-green', label: 'Solved' };
    case 'skipped':
      return { icon: SkipForward, color: 'text-neon-orange', label: 'Skipped' };
    case 'attempted':
      return { icon: Clock, color: 'text-neon-orange', label: 'Attempted' };
    case 'unlocked':
      return { icon: Circle, color: 'text-primary', label: 'Unlocked' };
    case 'locked':
      return { icon: Lock, color: 'text-muted-foreground/40', label: 'Locked' };
  }
}

function modeBadge(mode: string) {
  switch (mode) {
    case 'learning':
      return { text: 'Learning', classes: 'bg-neon-blue/10 text-neon-blue' };
    case 'revision':
      return { text: 'Revision', classes: 'bg-neon-purple/10 text-neon-purple' };
    case 'challenge':
      return { text: 'Challenge', classes: 'bg-red-500/10 text-red-400' };
    default:
      return { text: mode, classes: 'bg-secondary text-muted-foreground' };
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return { text: 'Active', classes: 'bg-neon-green/10 text-neon-green' };
    case 'paused':
      return { text: 'Paused', classes: 'bg-neon-orange/10 text-neon-orange' };
    case 'completed':
      return { text: 'Completed', classes: 'bg-neon-cyan/10 text-neon-cyan' };
    case 'abandoned':
      return { text: 'Abandoned', classes: 'bg-secondary text-muted-foreground' };
    default:
      return { text: status, classes: 'bg-secondary text-muted-foreground' };
  }
}

type CoachingAction = CoachingRequest['action'];

const COACHING_ACTIONS: { value: CoachingAction; label: string }[] = [
  { value: 'explain', label: 'Explain' },
  { value: 'hint', label: 'Hint' },
  { value: 'approach', label: 'Approach' },
  { value: 'pitfalls', label: 'Pitfalls' },
];

// ── Coaching Panel Sub-Component ────────────────────────────────

function CoachingPanel({ problemId }: { problemId: number }) {
  const coaching = useCoaching();
  const [hintLevel, setHintLevel] = useState(1);
  const [context, setContext] = useState('');
  const [response, setResponse] = useState<CoachingResponse | null>(null);
  const [activeAction, setActiveAction] = useState<CoachingAction | null>(null);

  async function handleAction(action: CoachingAction) {
    setActiveAction(action);
    try {
      const result = await coaching.mutateAsync({
        problem_id: problemId,
        action,
        hint_level: action === 'hint' ? hintLevel : 1,
        user_context: context || undefined,
      });
      setResponse(result);
    } catch {
      toast.error('Coaching request failed. Please try again.');
    } finally {
      setActiveAction(null);
    }
  }

  async function handleFollowUp(suggestion: string) {
    setActiveAction('explain');
    try {
      const result = await coaching.mutateAsync({
        problem_id: problemId,
        action: 'explain',
        hint_level: 1,
        user_context: suggestion,
      });
      setResponse(result);
    } catch {
      toast.error('Follow-up request failed.');
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border/50 bg-secondary/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        AI Coach
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {COACHING_ACTIONS.map((act) => (
          <button
            key={act.value}
            onClick={() => handleAction(act.value)}
            disabled={coaching.isPending}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              activeAction === act.value && coaching.isPending
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            {activeAction === act.value && coaching.isPending ? 'Loading...' : act.label}
          </button>
        ))}
      </div>

      {/* Hint level selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-muted-foreground">Hint Level:</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setHintLevel(level)}
              className={cn(
                'h-7 w-7 rounded-md text-xs font-medium transition-colors',
                hintLevel === level
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground border border-border hover:bg-accent',
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Context input */}
      <textarea
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Optional: describe your current approach or what you're stuck on..."
        rows={2}
        className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
      />

      {/* Response area */}
      {response && (
        <div className="space-y-3 rounded-lg border border-border/50 bg-card p-4">
          {response.warning && (
            <div className="rounded-md bg-neon-orange/10 px-3 py-2 text-xs text-neon-orange border border-neon-orange/20">
              {response.warning}
            </div>
          )}
          <div className="prose prose-sm prose-invert max-w-none text-foreground/90 prose-code:text-neon-cyan prose-code:bg-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-border/50 prose-strong:text-foreground prose-a:text-primary">
            <ReactMarkdown>{response.response}</ReactMarkdown>
          </div>

          {/* Follow-up suggestions */}
          {response.follow_up_suggestions.length > 0 && (
            <div className="border-t border-border/50 pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Follow-up questions:</p>
              <div className="flex flex-wrap gap-2">
                {response.follow_up_suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFollowUp(suggestion)}
                    disabled={coaching.isPending}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export default function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: path, isLoading, isError } = usePath(id ?? '');
  const markSolved = useMarkSolved();
  const skipProblem = useSkipProblem();
  const [expandedCoaching, setExpandedCoaching] = useState<number | null>(null);

  // ── Actions ─────────────────────────────────────────────────────

  async function handleMarkSolved(problemId: number) {
    if (!id) return;
    try {
      await markSolved.mutateAsync({ pathId: id, problemId });
      toast.success('Problem marked as solved!');
    } catch {
      toast.error('Failed to mark problem as solved.');
    }
  }

  async function handleSkip(position: number) {
    if (!id) return;
    try {
      await skipProblem.mutateAsync({ pathId: id, position });
      toast.success('Problem skipped.');
    } catch {
      toast.error('Failed to skip problem.');
    }
  }

  // ── Loading / Error ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !path) {
    return (
      <div className="p-4 lg:p-6 max-w-[1100px] mx-auto space-y-4">
        <Link
          to="/app/practice"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Paths
        </Link>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-destructive">
            Failed to load path details. The path may not exist or an error occurred.
          </p>
        </div>
      </div>
    );
  }

  const pct = Math.round(path.progress_pct);
  const sb = statusBadge(path.status);
  const mb = modeBadge(path.mode);

  // Find resume index
  const resumeIdx = path.problems.findIndex(
    (p) => p.status === 'attempted' || p.status === 'unlocked',
  );

  return (
    <div className="p-4 lg:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* ── Back link ──────────────────────────────────────────── */}
      <Link
        to="/app/practice"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Paths
      </Link>

      {/* ── Path Header ────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{path.name}</h1>
              <span className={`px-2 py-0.5 text-[10px] rounded font-semibold ${sb.classes}`}>
                {sb.text.toUpperCase()}
              </span>
              <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${mb.classes}`}>
                {mb.text}
              </span>
              {path.forced_mode && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded bg-neon-orange/10 text-neon-orange font-medium">
                  <Lock className="h-2.5 w-2.5" />
                  Forced
                </span>
              )}
            </div>

            {path.description && (
              <p className="mb-3 text-sm text-muted-foreground">{path.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                Rating {path.min_rating}–{path.max_rating}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Created{' '}
                {new Date(path.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {path.topics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {path.topics.map((t) => (
                    <span key={t} className="px-1.5 py-0.5 text-[10px] bg-accent border border-border/50 rounded text-muted-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress summary */}
          <div className="w-full sm:w-48">
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-semibold text-neon-cyan">{pct}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  path.status === 'completed'
                    ? 'bg-neon-green'
                    : 'bg-gradient-to-r from-neon-cyan to-primary',
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-center text-xs text-muted-foreground">
              {path.current_position} / {path.total_problems} problems
            </p>
          </div>
        </div>
      </div>

      {/* ── Problem Timeline ───────────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Problems</h2>

        {path.problems.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No problems in this path yet.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {path.problems.map((pp, idx) => {
              const isLocked = pp.status === 'locked';
              const isCurrent = pp.status === 'unlocked' || pp.status === 'attempted';
              const config = statusConfig(pp.status);
              const StatusIcon = config.icon;
              const isResume = idx === resumeIdx;

              return (
                <div
                  key={pp.id}
                  className={cn(
                    'px-4 lg:px-5 py-3 border-b border-border/30 last:border-b-0 transition-colors',
                    isLocked ? 'opacity-50' : 'hover:bg-accent/30',
                    isResume ? 'bg-primary/5 border-l-2 border-l-primary' : '',
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Status icon */}
                    <StatusIcon className={`w-5 h-5 shrink-0 ${config.color}`} />

                    {/* Problem info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">#{pp.position}</span>
                        {isLocked ? (
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {pp.problem.name}
                          </span>
                        ) : (
                          <a
                            href={pp.problem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                          >
                            {pp.problem.name}
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          </a>
                        )}
                        {isResume && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded font-semibold shrink-0">
                            RESUME
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {pp.problem.tags.slice(0, 4).map((tag) => (
                          <span key={tag.slug} className="text-[10px] text-muted-foreground">
                            {tag.name}
                          </span>
                        ))}
                        {pp.problem.tags.length > 4 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{pp.problem.tags.length - 4}
                          </span>
                        )}
                      </div>
                      {pp.solved_at && (
                        <p className="mt-1 text-xs text-neon-green">
                          Solved {new Date(pp.solved_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Right: rating + actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-semibold font-mono ${ratingColor(pp.problem.rating)}`}
                      >
                        {pp.problem.rating ?? '?'}
                      </span>

                      {isCurrent && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkSolved(pp.problem.id)}
                            disabled={markSolved.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neon-green/15 text-neon-green rounded-lg border border-neon-green/20 hover:bg-neon-green/25 transition-colors disabled:opacity-50"
                          >
                            {markSolved.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Solved
                          </button>
                          <button
                            onClick={() => handleSkip(pp.position)}
                            disabled={skipProblem.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                          >
                            {skipProblem.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <SkipForward className="h-3.5 w-3.5" />
                            )}
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Coaching toggle */}
                  {!isLocked && (
                    <div className="mt-2 ml-8">
                      <button
                        onClick={() =>
                          setExpandedCoaching((prev) =>
                            prev === pp.problem.id ? null : pp.problem.id,
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary/70 transition-colors hover:text-primary"
                      >
                        <Brain className="h-3.5 w-3.5" />
                        {expandedCoaching === pp.problem.id ? 'Hide Coach' : 'AI Coach'}
                      </button>

                      {expandedCoaching === pp.problem.id && (
                        <CoachingPanel problemId={pp.problem.id} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
