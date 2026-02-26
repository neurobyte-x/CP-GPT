import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

import { useProblems, useTags } from '@/hooks/useApi';
import { Card, RatingBadge, TagChip, Spinner, EmptyState } from '@/components/Layout';
import type { ProblemFilters } from '@/types';

const PAGE_SIZE = 25;

const SORT_OPTIONS: { value: ProblemFilters['sort_by']; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'solved_count', label: 'Solved Count' },
  { value: 'contest_id', label: 'Contest ID' },
  { value: 'name', label: 'Name' },
];

export default function ProblemsPage() {
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

  // Reset page when filters change
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

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Problems</h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse and filter Codeforces problems to find your next challenge.
        </p>
      </div>

      {/* Search & Filter Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search problems by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          Filters
          {(selectedTags.length > 0 || minRating || maxRating || excludeSolved) && (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-xs font-medium text-brand-700">
              {selectedTags.length + (minRating ? 1 : 0) + (maxRating ? 1 : 0) + (excludeSolved ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <div className="space-y-5">
            {/* Tags */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Tags</h3>
              {tagsLoading ? (
                <Spinner size="sm" />
              ) : tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <TagChip
                      key={tag.slug}
                      name={tag.name}
                      selected={selectedTags.includes(tag.slug)}
                      onClick={() => toggleTag(tag.slug)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No tags available.</p>
              )}
            </div>

            {/* Rating Range */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">Rating Range</h3>
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
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-400">to</span>
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
                  className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Sort & Options */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as ProblemFilters['sort_by']);
                    resetPage();
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={excludeSolved}
                  onChange={(e) => {
                    setExcludeSolved(e.target.checked);
                    resetPage();
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                Exclude solved problems
              </label>
            </div>

            {/* Clear Filters */}
            {(selectedTags.length > 0 || minRating || maxRating || excludeSolved) && (
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setMinRating('');
                  setMaxRating('');
                  setExcludeSolved(false);
                  resetPage();
                }}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Problem List */}
      {isLoading ? (
        <Spinner size="lg" />
      ) : isError ? (
        <Card>
          <p className="py-8 text-center text-sm text-red-500">
            Failed to load problems. Please try again.
          </p>
        </Card>
      ) : data && data.problems.length > 0 ? (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-medium text-gray-700">
                {(data.page - 1) * data.page_size + 1}–
                {Math.min(data.page * data.page_size, data.total)}
              </span>{' '}
              of <span className="font-medium text-gray-700">{data.total.toLocaleString()}</span>{' '}
              problems
            </p>
          </div>

          {/* Table */}
          <Card className="overflow-hidden !p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="whitespace-nowrap px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Problem
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Rating
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tags
                    </th>
                    <th className="whitespace-nowrap px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Solved
                    </th>
                    <th className="px-6 py-3">
                      <span className="sr-only">Link</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.problems.map((problem) => (
                    <tr
                      key={problem.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      {/* Problem ID */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {problem.contest_id}{problem.problem_index}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-brand-600"
                        >
                          {problem.name}
                        </a>
                        {problem.contest_name && (
                          <p className="mt-0.5 text-xs text-gray-400 truncate max-w-xs">
                            {problem.contest_name}
                          </p>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <RatingBadge rating={problem.rating} />
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {problem.tags.slice(0, 4).map((tag) => (
                            <TagChip
                              key={tag.slug}
                              name={tag.name}
                              selected={selectedTags.includes(tag.slug)}
                              onClick={() => toggleTag(tag.slug)}
                            />
                          ))}
                          {problem.tags.length > 4 && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                              +{problem.tags.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Solved Count */}
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-600">
                        {problem.solved_count.toLocaleString()}
                      </td>

                      {/* External Link */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 transition-colors hover:text-brand-600"
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
          </Card>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-gray-500">
                Page{' '}
                <span className="font-medium text-gray-700">{data.page}</span>{' '}
                of{' '}
                <span className="font-medium text-gray-700">{data.total_pages}</span>
              </span>

              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No problems found"
          description="Try adjusting your filters or search query to find problems."
        />
      )}
    </div>
  );
}
