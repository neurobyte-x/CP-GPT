import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Route,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  Lock,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

import { usePaths, useCreatePath, useTags } from '@/hooks/useApi';
import { Card, ProgressBar, Spinner, EmptyState, TagChip } from '@/components/Layout';
import type { CreatePathRequest, PracticePath } from '@/types';

// ── Constants ───────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'paused' | 'completed' | 'abandoned';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'abandoned', label: 'Abandoned' },
];

const MODE_OPTIONS: { value: CreatePathRequest['mode']; label: string; description: string }[] = [
  {
    value: 'learning',
    label: 'Learning',
    description: 'Problems slightly above your level to steadily improve',
  },
  {
    value: 'revision',
    label: 'Revision',
    description: 'Problems at or below your level to solidify knowledge',
  },
  {
    value: 'challenge',
    label: 'Challenge',
    description: 'Hard problems well above your current rating',
  },
];

const INITIAL_FORM: CreatePathRequest = {
  name: '',
  topics: [],
  min_rating: 800,
  max_rating: 1600,
  mode: 'learning',
  forced_mode: false,
  problem_count: 20,
};

// ── Helpers ─────────────────────────────────────────────────────

function statusIcon(status: PracticePath['status']) {
  switch (status) {
    case 'active':
      return <Play className="h-3.5 w-3.5 text-green-500" />;
    case 'paused':
      return <Pause className="h-3.5 w-3.5 text-yellow-500" />;
    case 'completed':
      return <CheckCircle className="h-3.5 w-3.5 text-brand-600" />;
    case 'abandoned':
      return <X className="h-3.5 w-3.5 text-gray-400" />;
  }
}

function statusBadgeColor(status: PracticePath['status']) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700';
    case 'paused':
      return 'bg-yellow-100 text-yellow-700';
    case 'completed':
      return 'bg-brand-100 text-brand-700';
    case 'abandoned':
      return 'bg-gray-100 text-gray-600';
  }
}

function modeBadgeColor(mode: PracticePath['mode']) {
  switch (mode) {
    case 'learning':
      return 'bg-blue-100 text-blue-700';
    case 'revision':
      return 'bg-purple-100 text-purple-700';
    case 'challenge':
      return 'bg-red-100 text-red-700';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Main Component ──────────────────────────────────────────────

export default function PathsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreatePathRequest>({ ...INITIAL_FORM });

  const { data: paths, isLoading, isError } = usePaths(
    statusFilter === 'all' ? undefined : statusFilter,
  );
  const { data: tags, isLoading: tagsLoading } = useTags();
  const createPath = useCreatePath();

  // ── Form handlers ───────────────────────────────────────────────

  function toggleTopic(slug: string) {
    setForm((prev) => ({
      ...prev,
      topics: prev.topics.includes(slug)
        ? prev.topics.filter((t) => t !== slug)
        : [...prev.topics, slug],
    }));
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Please enter a path name.');
      return;
    }
    if (form.topics.length === 0) {
      toast.error('Select at least one topic.');
      return;
    }
    if (form.min_rating >= form.max_rating) {
      toast.error('Min rating must be less than max rating.');
      return;
    }

    try {
      await createPath.mutateAsync(form);
      toast.success('Practice path created!');
      setShowCreate(false);
      setForm({ ...INITIAL_FORM });
    } catch {
      toast.error('Failed to create path. Please try again.');
    }
  }

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Paths</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create structured practice sequences to level up your competitive programming skills.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Create New Path
        </button>
      </div>

      {/* ── Creation Form ──────────────────────────────────────── */}
      {showCreate && (
        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">New Practice Path</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Path Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. DP Mastery, Graph Fundamentals"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Topics */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Topics{' '}
                <span className="font-normal text-gray-400">
                  ({form.topics.length} selected)
                </span>
              </label>
              {tagsLoading ? (
                <Spinner size="sm" />
              ) : tags && tags.length > 0 ? (
                <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {tags.map((tag) => (
                    <TagChip
                      key={tag.slug}
                      name={tag.name}
                      selected={form.topics.includes(tag.slug)}
                      onClick={() => toggleTopic(tag.slug)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No tags available.</p>
              )}
            </div>

            {/* Rating Range */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Rating Range</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Min: {form.min_rating}</label>
                  <input
                    type="range"
                    min={800}
                    max={3500}
                    step={100}
                    value={form.min_rating}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, min_rating: Number(e.target.value) }))
                    }
                    className="w-full accent-brand-600"
                  />
                </div>
                <span className="mt-4 text-sm text-gray-400">to</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-gray-500">Max: {form.max_rating}</label>
                  <input
                    type="range"
                    min={800}
                    max={3500}
                    step={100}
                    value={form.max_rating}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, max_rating: Number(e.target.value) }))
                    }
                    className="w-full accent-brand-600"
                  />
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mode</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((prev) => ({ ...prev, mode: opt.value }))}
                    className={clsx(
                      'rounded-lg border-2 p-4 text-left transition-colors',
                      form.mode === opt.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    )}
                  >
                    <p
                      className={clsx(
                        'text-sm font-semibold',
                        form.mode === opt.value ? 'text-brand-700' : 'text-gray-900',
                      )}
                    >
                      {opt.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{opt.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Forced Mode Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setForm((prev) => ({ ...prev, forced_mode: !prev.forced_mode }))}
                className={clsx(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  form.forced_mode ? 'bg-brand-600' : 'bg-gray-200',
                )}
              >
                <span
                  className={clsx(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                    form.forced_mode ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  <Lock className="mr-1 inline h-3.5 w-3.5" />
                  Forced Mode
                </p>
                <p className="text-xs text-gray-500">
                  Lock upcoming problems until the current one is solved
                </p>
              </div>
            </div>

            {/* Problem Count */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Problem Count: {form.problem_count}
              </label>
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={form.problem_count}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, problem_count: Number(e.target.value) }))
                }
                className="w-full accent-brand-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>5</span>
                <span>100</span>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={createPath.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                {createPath.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Path
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* ── Filter Tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={clsx(
              'flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Path List ──────────────────────────────────────────── */}
      {isLoading ? (
        <Spinner size="lg" />
      ) : isError ? (
        <Card>
          <p className="py-8 text-center text-sm text-red-500">
            Failed to load paths. Please try again.
          </p>
        </Card>
      ) : paths && paths.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {paths.map((path: PracticePath) => (
            <Link
              key={path.id}
              to={`/paths/${path.id}`}
              className="block transition-shadow hover:shadow-md"
            >
              <Card className="h-full">
                {/* Top row: name + badges */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                    {path.name}
                  </h3>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        modeBadgeColor(path.mode),
                      )}
                    >
                      {path.mode}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        statusBadgeColor(path.status),
                      )}
                    >
                      {statusIcon(path.status)}
                      {path.status}
                    </span>
                  </div>
                </div>

                {/* Topics */}
                {path.topics.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {path.topics.slice(0, 5).map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {topic}
                      </span>
                    ))}
                    {path.topics.length > 5 && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        +{path.topics.length - 5}
                      </span>
                    )}
                  </div>
                )}

                {/* Rating range */}
                <div className="mb-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {path.min_rating}–{path.max_rating}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(path.created_at)}
                  </span>
                  {path.forced_mode && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Lock className="h-3 w-3" />
                      Forced
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {path.current_position}/{path.total_problems} problems
                  </span>
                  <span className="font-medium text-brand-600">
                    {Math.round(path.progress_pct)}%
                  </span>
                </div>
                <ProgressBar
                  value={path.progress_pct}
                  color={path.status === 'completed' ? 'green' : 'brand'}
                />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Route}
          title="No paths found"
          description={
            statusFilter === 'all'
              ? 'Create your first practice path to start structured training.'
              : `No ${statusFilter} paths. Switch tabs or create a new path.`
          }
          action={
            !showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" />
                Create Path
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
