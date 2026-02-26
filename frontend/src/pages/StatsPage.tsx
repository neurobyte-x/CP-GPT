/**
 * Statistics page — detailed view of user progress and topic mastery.
 */

import { useDashboard, useTopicStats } from '@/hooks/useApi';
import { Card, ProgressBar, Spinner, EmptyState } from '@/components/Layout';
import { BarChart3, TrendingUp, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { getRatingBadgeColor } from '@/types';
import { clsx } from 'clsx';

export default function StatsPage() {
  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: topicStats, isLoading: topicsLoading } = useTopicStats();

  if (dashLoading || topicsLoading) return <Spinner size="lg" />;

  const ratingData = dashboard
    ? Object.entries(dashboard.rating_distribution)
        .map(([bucket, count]) => ({
          rating: bucket,
          count,
        }))
        .sort((a, b) => Number(a.rating) - Number(b.rating))
    : [];

  const radarData = (topicStats ?? []).slice(0, 8).map((ts) => ({
    topic: ts.tag_name.length > 12 ? ts.tag_name.slice(0, 12) + '...' : ts.tag_name,
    skill: ts.estimated_skill,
    solved: ts.problems_solved,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>
        <p className="text-sm text-gray-500">Detailed analysis of your competitive programming progress</p>
      </div>

      {/* Rating Distribution */}
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Rating Distribution</h2>
        {ratingData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingData}>
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">No data yet. Solve some problems to see your distribution.</p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Topic Radar */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Topic Skill Radar</h2>
          {radarData.length > 2 ? (
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[800, 2400]} tick={{ fontSize: 10 }} />
                <Radar name="Skill" dataKey="skill" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-gray-400">Need data in at least 3 topics for radar chart.</p>
          )}
        </Card>

        {/* Topic Detail Table */}
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Topic Breakdown</h2>
          {topicStats && topicStats.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {topicStats.map((ts) => (
                <div key={ts.tag_slug} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{ts.tag_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{ts.problems_solved} solved</span>
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          getRatingBadgeColor(ts.estimated_skill)
                        )}
                      >
                        {ts.estimated_skill}
                      </span>
                    </div>
                  </div>
                  <ProgressBar value={ts.estimated_skill - 800} max={2000} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No topic data"
              description="Solve problems to see topic stats"
            />
          )}
        </Card>
      </div>

      {/* Summary Stats */}
      {dashboard && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Solve Rate</p>
                <p className="text-xl font-bold">
                  {dashboard.total_problems_attempted > 0
                    ? Math.round((dashboard.total_problems_solved / dashboard.total_problems_attempted) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Estimated Rating</p>
                <p className="text-xl font-bold">{dashboard.estimated_rating ?? 'N/A'}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-500">Total Practice Time</p>
                <p className="text-xl font-bold">{dashboard.total_time_spent_hours}h</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
