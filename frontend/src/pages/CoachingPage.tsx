/**
 * AI Coaching standalone page — for coaching without a specific path context.
 */

import { useState } from 'react';
import { useProblems, useCoaching } from '@/hooks/useApi';
import { Card, RatingBadge, Spinner } from '@/components/Layout';
import { Brain, Search, MessageCircle, Lightbulb, AlertTriangle, Compass, Bug, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import type { CoachingResponse } from '@/types';

const ACTIONS = [
  { key: 'explain', label: 'Explain', icon: BookOpen, description: 'Understand the problem' },
  { key: 'hint', label: 'Hint', icon: Lightbulb, description: 'Get a graded hint' },
  { key: 'approach', label: 'Approaches', icon: Compass, description: 'Possible strategies' },
  { key: 'pitfalls', label: 'Pitfalls', icon: Bug, description: 'Common mistakes' },
  { key: 'analyze', label: 'Analyze', icon: MessageCircle, description: 'Post-solve analysis' },
] as const;

export default function CoachingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<string>('explain');
  const [hintLevel, setHintLevel] = useState(1);
  const [userContext, setUserContext] = useState('');
  const [coachingResult, setCoachingResult] = useState<CoachingResponse | null>(null);

  const { data: problemsData, isLoading: problemsLoading } = useProblems({
    search: searchQuery || undefined,
    page_size: 10,
    page: 1,
  });

  const coachingMutation = useCoaching();

  const handleGetCoaching = async () => {
    if (!selectedProblemId) return;
    try {
      const result = await coachingMutation.mutateAsync({
        problem_id: selectedProblemId,
        action: selectedAction as 'explain' | 'hint' | 'approach' | 'pitfalls' | 'analyze' | 'solution',
        hint_level: hintLevel,
        user_context: userContext || undefined,
      });
      setCoachingResult(result);
    } catch {
      // Error handled by mutation
    }
  };

  const selectedProblem = problemsData?.problems.find((p) => p.id === selectedProblemId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Coach</h1>
        <p className="text-sm text-gray-500">Get coaching assistance on any problem</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Problem Selection */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Select a Problem</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or contest ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="mt-3 max-h-[400px] space-y-1 overflow-y-auto">
              {problemsLoading && <Spinner size="sm" />}
              {problemsData?.problems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProblemId(p.id)}
                  className={clsx(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    selectedProblemId === p.id
                      ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs text-gray-400">
                      {p.contest_id}{p.problem_index}
                    </span>{' '}
                    <span className="truncate">{p.name}</span>
                  </div>
                  <RatingBadge rating={p.rating} />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Coaching Interface */}
        <div className="space-y-4 lg:col-span-2">
          {selectedProblem ? (
            <>
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedProblem.contest_id}{selectedProblem.problem_index} — {selectedProblem.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <RatingBadge rating={selectedProblem.rating} />
                      {selectedProblem.tags.slice(0, 4).map((t) => (
                        <span key={t.id} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <a
                    href={selectedProblem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-600 hover:underline"
                  >
                    Open on CF
                  </a>
                </div>

                {/* Action Selection */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">What do you need?</label>
                  <div className="flex flex-wrap gap-2">
                    {ACTIONS.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => setSelectedAction(a.key)}
                        className={clsx(
                          'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                          selectedAction === a.key
                            ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        <a.icon className="h-4 w-4" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hint Level */}
                {selectedAction === 'hint' && (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Hint Level: {hintLevel}/5
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => setHintLevel(lvl)}
                          className={clsx(
                            'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                            hintLevel === lvl
                              ? 'bg-brand-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      1 = vague nudge, 5 = near-complete walkthrough
                    </p>
                  </div>
                )}

                {/* User Context */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Your context (optional)
                  </label>
                  <textarea
                    value={userContext}
                    onChange={(e) => setUserContext(e.target.value)}
                    placeholder="Describe your current approach, where you're stuck, etc."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <button
                  onClick={handleGetCoaching}
                  disabled={coachingMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <Brain className="h-4 w-4" />
                  {coachingMutation.isPending ? 'Thinking...' : 'Get Coaching'}
                </button>
              </Card>

              {/* Response */}
              {coachingResult && (
                <Card>
                  {coachingResult.warning && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {coachingResult.warning}
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{coachingResult.response}</ReactMarkdown>
                  </div>
                  {coachingResult.follow_up_suggestions.length > 0 && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="mb-2 text-xs font-medium text-gray-500">Suggested next steps:</p>
                      <div className="flex flex-wrap gap-2">
                        {coachingResult.follow_up_suggestions.map((s, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          ) : (
            <Card className="flex flex-col items-center justify-center py-16">
              <Brain className="mb-4 h-16 w-16 text-gray-200" />
              <h3 className="text-lg font-medium text-gray-700">Select a problem to get started</h3>
              <p className="mt-1 text-sm text-gray-400">
                Search for a problem on the left, then choose a coaching action.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
