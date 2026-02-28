/**
 * PathsPage — Practice Paths list (dark theme).
 * Combines UI reference design with real backend data.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Route,
  CheckCircle2,
  Clock,
  Target,
  Lock,
  X,
  Trophy,
  Zap,
  ChevronDown,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { usePaths, useCreatePath, useTags } from '@/hooks/useApi';
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

function statusBadge(status: PracticePath['status']) {
  switch (status) {
    case 'active':
      return { text: 'Active', classes: 'bg-neon-green/10 text-neon-green' };
    case 'paused':
      return { text: 'Paused', classes: 'bg-neon-orange/10 text-neon-orange' };
    case 'completed':
      return { text: 'Completed', classes: 'bg-neon-cyan/10 text-neon-cyan' };
    case 'abandoned':
      return { text: 'Abandoned', classes: 'bg-secondary text-muted-foreground' };
  }
}

function modeBadge(mode: PracticePath['mode']) {
  switch (mode) {
    case 'learning':
      return { text: 'Learning', classes: 'bg-neon-blue/10 text-neon-blue' };
    case 'revision':
      return { text: 'Revision', classes: 'bg-neon-purple/10 text-neon-purple' };
    case 'challenge':
      return { text: 'Challenge', classes: 'bg-red-500/10 text-red-400' };
  }
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

  // Derive stats
  const totalPaths = paths?.length ?? 0;
  const totalSolved = paths?.reduce((acc, p) => acc + p.current_position, 0) ?? 0;
  const totalProblems = paths?.reduce((acc, p) => acc + p.total_problems, 0) ?? 0;

  return (
    <div className="p-4 lg:p-6 max-w-[1100px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Route className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Practice Paths</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Create structured practice sequences to level up your competitive programming skills.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <Plus className="h-4 w-4" />
          Create New Path
        </button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Trophy, label: 'Total Paths', value: String(totalPaths), color: 'text-neon-orange', bg: 'bg-neon-orange/10' },
          { icon: CheckCircle2, label: 'Problems Solved', value: `${totalSolved} / ${totalProblems}`, color: 'text-neon-green', bg: 'bg-neon-green/10' },
          { icon: Zap, label: 'Active', value: String(paths?.filter((p) => p.status === 'active').length ?? 0), color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-lg font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Creation Form ──────────────────────────────────────── */}
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">New Practice Path</h2>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Path Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. DP Mastery, Graph Fundamentals"
              className="w-full rounded-lg border border-border bg-input-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Topics */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Topics{' '}
              <span className="font-normal text-muted-foreground">
                ({form.topics.length} selected)
              </span>
            </label>
            {tagsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : tags && tags.length > 0 ? (
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border/50 bg-secondary/30 p-3">
                {tags.map((tag) => (
                  <button
                    key={tag.slug}
                    onClick={() => toggleTopic(tag.slug)}
                    className={cn(
                      'px-2.5 py-1 text-xs rounded-md border transition-colors',
                      form.topics.includes(tag.slug)
                        ? 'bg-primary/15 border-primary/30 text-primary'
                        : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-border',
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags available.</p>
            )}
          </div>

          {/* Rating Range */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Rating Range</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Min: {form.min_rating}</label>
                <input
                  type="range"
                  min={800}
                  max={3500}
                  step={100}
                  value={form.min_rating}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, min_rating: Number(e.target.value) }))
                  }
                  className="w-full accent-white"
                />
              </div>
              <span className="mt-4 text-sm text-muted-foreground">to</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Max: {form.max_rating}</label>
                <input
                  type="range"
                  min={800}
                  max={3500}
                  step={100}
                  value={form.max_rating}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, max_rating: Number(e.target.value) }))
                  }
                  className="w-full accent-white"
                />
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Mode</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm((prev) => ({ ...prev, mode: opt.value }))}
                  className={cn(
                    'rounded-lg border-2 p-4 text-left transition-colors',
                    form.mode === opt.value
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-card hover:border-border',
                  )}
                >
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      form.mode === opt.value ? 'text-primary' : 'text-foreground',
                    )}
                  >
                    {opt.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Forced Mode Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm((prev) => ({ ...prev, forced_mode: !prev.forced_mode }))}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                form.forced_mode ? 'bg-primary' : 'bg-secondary',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-foreground shadow ring-0 transition-transform',
                  form.forced_mode ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
            <div>
              <p className="text-sm font-medium text-foreground">
                <Lock className="mr-1 inline h-3.5 w-3.5" />
                Forced Mode
              </p>
              <p className="text-xs text-muted-foreground">
                Lock upcoming problems until the current one is solved
              </p>
            </div>
          </div>

          {/* Problem Count */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
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
              className="w-full accent-white"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>100</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={createPath.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              {createPath.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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
      )}

      {/* ── Filter Tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Path List ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-sm text-destructive">Failed to load paths. Please try again.</p>
        </div>
      ) : paths && paths.length > 0 ? (
        <div className="space-y-4">
          {paths.map((path: PracticePath) => {
            const pct = Math.round(path.progress_pct);
            const sb = statusBadge(path.status);
            const mb = modeBadge(path.mode);

            return (
              <Link
                key={path.id}
                to={`/app/practice/${path.id}`}
                className="block bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors"
              >
                <div className="p-4 lg:p-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-lg ${path.status === 'active' ? 'bg-primary/15' : 'bg-secondary'} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Route className={`w-5 h-5 ${path.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold truncate">{path.name}</h3>
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

                      {/* Topics */}
                      {path.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {path.topics.slice(0, 5).map((topic) => (
                            <span
                              key={topic}
                              className="text-[10px] px-1.5 py-0.5 bg-accent border border-border/50 text-muted-foreground rounded"
                            >
                              {topic}
                            </span>
                          ))}
                          {path.topics.length > 5 && (
                            <span className="text-[10px] text-muted-foreground">+{path.topics.length - 5}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {path.current_position}/{path.total_problems} solved
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {path.min_rating}–{path.max_rating}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Route className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No paths found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {statusFilter === 'all'
              ? 'Create your first practice path to start structured training.'
              : `No ${statusFilter} paths. Switch tabs or create a new path.`}
          </p>
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Plus className="h-4 w-4" />
              Create Path
            </button>
          )}
        </div>
      )}
    </div>
  );
}
