import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';

import { useProblems, useTags } from '@/hooks/useApi';
import type { ProblemFilters } from '@/types';

const PAGE_SIZE = 25;

const SORT_OPTIONS: { value: ProblemFilters['sort_by']; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'solved_count', label: 'Solved Count' },
  { value: 'contest_id', label: 'Contest ID' },
  { value: 'name', label: 'Name' },
];

function ratingColor(r: number | null) {
  if (r === null) return 'text-muted-foreground';
  if (r < 1200) return 'text-gray-400';
  if (r < 1400) return 'text-green-400';
  if (r < 1600) return 'text-cyan-400';
  if (r < 1900) return 'text-blue-400';
  if (r < 2100) return 'text-purple-400';
  return 'text-red-400';
}

function ratingBg(r: number | null) {
  if (r === null) return 'bg-muted/50';
  if (r < 1200) return 'bg-gray-400/10';
  if (r < 1400) return 'bg-green-400/10';
  if (r < 1600) return 'bg-cyan-400/10';
  if (r < 1900) return 'bg-blue-400/10';
  if (r < 2100) return 'bg-purple-400/10';
  return 'bg-red-400/10';
}

export default function ProblemsPage() {
  const navigate = useNavigate();

  // ── Filter state ────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<string>('');
  const [maxRating, setMaxRating] = useState<string>('');
  const [sortBy, setSortBy] = useState<ProblemFilters['sort_by']>('rating');
  const [sortOrder, setSortOrder] = useState<ProblemFilters['sort_order']>('asc');
  const [excludeSolved, setExcludeSolved] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // ── Debounce search ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const resetPage = useCallback(() => setPage(1), []);

  // ── Build filters object ────────────────────────────────────────
  const filters: ProblemFilters = {
    page,
    page_size: PAGE_SIZE,
    sort_by: sortBy,
    sort_order: sortOrder,
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(selectedTags.length > 0 && { tags: selectedTags.join(',') }),
    ...(minRating && { min_rating: Number(minRating) }),
    ...(maxRating && { max_rating: Number(maxRating) }),
    ...(excludeSolved && { exclude_solved: true }),
  };

  const { data, isLoading, isError } = useProblems(filters);
  const { data: tags, isLoading: tagsLoading } = useTags();

  // ── Tag toggle ──────────────────────────────────────────────────
  function toggleTag(slug: string) {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug],
    );
    resetPage();
  }

  const activeFilterCount =
    selectedTags.length + (minRating ? 1 : 0) + (maxRating ? 1 : 0) + (excludeSolved ? 1 : 0);

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Problems</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and filter Codeforces problems to find your next challenge.
        </p>
      </div>

      {/* Search & Filter Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search problems by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-secondary/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            showFilters
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Tags */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-foreground">Tags</h3>
            {tagsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : tags && tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.slug}
                    onClick={() => toggleTag(tag.slug)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      selectedTags.includes(tag.slug)
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-secondary/60 text-muted-foreground border border-border hover:text-foreground hover:bg-accent'
                    }`}
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
            <h3 className="mb-2 text-sm font-medium text-foreground">Rating Range</h3>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Min"
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value);
                  resetPage();
                }}
                min={0}
                step={100}
                className="w-28 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="number"
                placeholder="Max"
                value={maxRating}
                onChange={(e) => {
                  setMaxRating(e.target.value);
                  resetPage();
                }}
                min={0}
                step={100}
                className="w-28 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Sort & Options */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <h3 className="mb-2 text-sm font-medium text-foreground">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as ProblemFilters['sort_by']);
                  resetPage();
                }}
                className="rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm text-foreground focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                resetPage();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>

            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={excludeSolved}
                onChange={(e) => {
                  setExcludeSolved(e.target.checked);
                  resetPage();
                }}
                className="h-4 w-4 rounded border-border bg-secondary accent-primary"
              />
              Exclude solved
            </label>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSelectedTags([]);
                setMinRating('');
                setMaxRating('');
                setExcludeSolved(false);
                resetPage();
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Problem List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-destructive">
            Failed to load problems. Please try again.
          </p>
        </div>
      ) : data && data.problems.length > 0 ? (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing{' '}
              <span className="font-medium text-foreground">
                {(data.page - 1) * data.page_size + 1}–
                {Math.min(data.page * data.page_size, data.total)}
              </span>{' '}
              of <span className="font-medium text-foreground">{data.total.toLocaleString()}</span>{' '}
              problems
            </p>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/40">
                    <th className="whitespace-nowrap px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Problem
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Name
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Rating
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Tags
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Solved
                    </th>
                    <th className="px-6 py-3">
                      <span className="sr-only">Link</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.problems.map((problem) => (
                    <tr
                      key={problem.id}
                      className="transition-colors hover:bg-accent/50 cursor-pointer"
                      onClick={() => navigate(`/app/problems/${problem.id}`)}
                    >
                      {/* Problem ID */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className="text-sm font-medium text-foreground"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {problem.contest_id}{problem.problem_index}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground hover:text-primary transition-colors">
                          {problem.name}
                        </span>
                        {problem.contest_name && (
                          <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-xs">
                            {problem.contest_name}
                          </p>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {problem.rating ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${ratingColor(problem.rating)} ${ratingBg(problem.rating)}`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            {problem.rating}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.slug}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTag(tag.slug);
                              }}
                              className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer transition-colors ${
                                selectedTags.includes(tag.slug)
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-accent text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {problem.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent text-muted-foreground">
                              +{problem.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Solved Count */}
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-muted-foreground">
                        {problem.solved_count.toLocaleString()}
                      </td>

                      {/* External Link */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground transition-colors hover:text-primary"
                          title="Open on Codeforces"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-muted-foreground">
                Page{' '}
                <span className="font-medium text-foreground">{data.page}</span>{' '}
                of{' '}
                <span className="font-medium text-foreground">{data.total_pages}</span>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary/60 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">No problems found</h3>
          <p className="text-xs text-muted-foreground max-w-xs">
            Try adjusting your filters or search query to find problems.
          </p>
        </div>
      )}
    </div>
  );
}
