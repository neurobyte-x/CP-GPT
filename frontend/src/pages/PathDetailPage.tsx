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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';

import { usePath, useMarkSolved, useSkipProblem, useCoaching } from '@/hooks/useApi';
import { Card, RatingBadge, ProgressBar, Spinner, TagChip } from '@/components/Layout';
import type { PathProblem, CoachingRequest, CoachingResponse } from '@/types';

// ── Helpers ─────────────────────────────────────────────────────

function modeBadgeColor(mode: string) {
  switch (mode) {
    case 'learning':
      return 'bg-blue-100 text-blue-700';
    case 'revision':
      return 'bg-purple-100 text-purple-700';
    case 'challenge':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function statusBadgeColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'paused':
      return 'bg-yellow-100 text-yellow-700';
    case 'completed':
      return 'bg-brand-100 text-brand-700';
    case 'abandoned':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function problemStatusIcon(status: PathProblem['status']) {
  switch (status) {
    case 'solved':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'skipped':
      return <SkipForward className="h-4 w-4 text-yellow-500" />;
    case 'unlocked':
    case 'attempted':
      return <Unlock className="h-4 w-4 text-brand-600" />;
    case 'locked':
      return <Lock className="h-4 w-4 text-gray-300" />;
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
    <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Brain className="h-4 w-4 text-purple-500" />
        AI Coach
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {COACHING_ACTIONS.map((act) => (
          <button
            key={act.value}
            onClick={() => handleAction(act.value)}
            disabled={coaching.isPending}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              activeAction === act.value && coaching.isPending
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            {activeAction === act.value && coaching.isPending ? 'Loading...' : act.label}
          </button>
        ))}
      </div>

      {/* Hint level selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-600">Hint Level:</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              onClick={() => setHintLevel(level)}
              className={clsx(
                'h-7 w-7 rounded-md text-xs font-medium transition-colors',
                hintLevel === level
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
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
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />

      {/* Response area */}
      {response && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
          {response.warning && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {response.warning}
            </div>
          )}
          <div className="prose prose-sm max-w-none text-gray-800">
            <ReactMarkdown>{response.response}</ReactMarkdown>
          </div>

          {/* Follow-up suggestions */}
          {response.follow_up_suggestions.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Follow-up questions:</p>
              <div className="flex flex-wrap gap-2">
                {response.follow_up_suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleFollowUp(suggestion)}
                    disabled={coaching.isPending}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
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
  const { pathId } = useParams<{ pathId: string }>();
  const { data: path, isLoading, isError } = usePath(pathId ?? '');
  const markSolved = useMarkSolved();
  const skipProblem = useSkipProblem();
  const [expandedCoaching, setExpandedCoaching] = useState<number | null>(null);

  // ── Actions ─────────────────────────────────────────────────────

  async function handleMarkSolved(problemId: number) {
    if (!pathId) return;
    try {
      await markSolved.mutateAsync({ pathId, problemId });
      toast.success('Problem marked as solved!');
    } catch {
      toast.error('Failed to mark problem as solved.');
    }
  }

  async function handleSkip(position: number) {
    if (!pathId) return;
    try {
      await skipProblem.mutateAsync({ pathId, position });
      toast.success('Problem skipped.');
    } catch {
      toast.error('Failed to skip problem.');
    }
  }

  // ── Loading / Error ─────────────────────────────────────────────

  if (isLoading) {
    return <Spinner size="lg" />;
  }

  if (isError || !path) {
    return (
      <div className="space-y-4">
        <Link
          to="/paths"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Paths
        </Link>
        <Card>
          <p className="py-8 text-center text-sm text-red-500">
            Failed to load path details. The path may not exist or an error occurred.
          </p>
        </Card>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Back link ──────────────────────────────────────────── */}
      <Link
        to="/paths"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Paths
      </Link>

      {/* ── Path Header ────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{path.name}</h1>
              <span
                className={clsx(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  modeBadgeColor(path.mode),
                )}
              >
                {path.mode}
              </span>
              <span
                className={clsx(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusBadgeColor(path.status),
                )}
              >
                {path.status}
              </span>
              {path.forced_mode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  <Lock className="h-3 w-3" />
                  Forced
                </span>
              )}
            </div>

            {path.description && (
              <p className="mb-3 text-sm text-gray-600">{path.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
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
                    <TagChip key={t} name={t} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress summary */}
          <div className="w-full sm:w-48">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
              <span>Progress</span>
              <span className="font-semibold text-brand-600">
                {Math.round(path.progress_pct)}%
              </span>
            </div>
            <ProgressBar
              value={path.progress_pct}
              color={path.status === 'completed' ? 'green' : 'brand'}
            />
            <p className="mt-1.5 text-center text-xs text-gray-500">
              {path.current_position} / {path.total_problems} problems
            </p>
          </div>
        </div>
      </Card>

      {/* ── Problem Timeline ───────────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Problems</h2>

        {path.problems.length === 0 ? (
          <Card>
            <p className="py-8 text-center text-sm text-gray-400">
              No problems in this path yet.
            </p>
          </Card>
        ) : (
          <div className="relative space-y-0">
            {/* Vertical timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />

            {path.problems.map((pp, _idx) => {
              const isLocked = pp.status === 'locked';
              const isCurrent = pp.status === 'unlocked' || pp.status === 'attempted';
              const isSolved = pp.status === 'solved';
              const isSkipped = pp.status === 'skipped';

              return (
                <div key={pp.id} className="relative pl-12 pb-6 last:pb-0">
                  {/* Timeline dot */}
                  <div
                    className={clsx(
                      'absolute left-3 top-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white',
                      isSolved
                        ? 'bg-green-500'
                        : isSkipped
                          ? 'bg-yellow-400'
                          : isCurrent
                            ? 'bg-brand-500 ring-brand-100'
                            : 'bg-gray-200',
                    )}
                  >
                    {isSolved && <Check className="h-3 w-3 text-white" />}
                    {isSkipped && <SkipForward className="h-3 w-3 text-white" />}
                    {isCurrent && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                    {isLocked && <Lock className="h-2.5 w-2.5 text-gray-400" />}
                  </div>

                  {/* Problem Card */}
                  <div
                    className={clsx(
                      'rounded-lg border p-4 transition-colors',
                      isLocked
                        ? 'border-gray-100 bg-gray-50 opacity-60'
                        : isCurrent
                          ? 'border-brand-200 bg-brand-50/30 shadow-sm'
                          : 'border-gray-200 bg-white',
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: problem info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-400">
                            #{pp.position}
                          </span>
                          {problemStatusIcon(pp.status)}
                          {isLocked ? (
                            <span className="text-sm font-medium text-gray-400">
                              {pp.problem.name}
                            </span>
                          ) : (
                            <a
                              href={pp.problem.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-brand-600"
                            >
                              {pp.problem.name}
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </a>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <RatingBadge rating={pp.problem.rating} />
                          {pp.problem.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag.slug}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {pp.problem.tags.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{pp.problem.tags.length - 4}
                            </span>
                          )}
                        </div>

                        {/* Timestamps */}
                        {pp.solved_at && (
                          <p className="mt-1.5 text-xs text-green-600">
                            Solved {new Date(pp.solved_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Right: action buttons */}
                      {isCurrent && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkSolved(pp.problem.id)}
                            disabled={markSolved.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                          >
                            {markSolved.isPending ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Mark Solved
                          </button>
                          <button
                            onClick={() => handleSkip(pp.position)}
                            disabled={skipProblem.isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                          >
                            {skipProblem.isPending ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            ) : (
                              <SkipForward className="h-3.5 w-3.5" />
                            )}
                            Skip
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Coaching toggle (for non-locked problems) */}
                    {!isLocked && (
                      <div className="mt-2">
                        <button
                          onClick={() =>
                            setExpandedCoaching((prev) =>
                              prev === pp.problem.id ? null : pp.problem.id,
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-700"
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
