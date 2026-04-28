import { ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { ChatProblem } from '@/types';
import { toast } from 'sonner';

function ratingColor(r: number | null): string {
  if (r === null) return 'text-gray-400';
  if (r < 1200) return 'text-gray-400';
  if (r < 1400) return 'text-green-400';
  if (r < 1600) return 'text-cyan-400';
  if (r < 1900) return 'text-blue-400';
  if (r < 2100) return 'text-purple-400';
  return 'text-red-400';
}

interface ProblemCardProps {
  problem: ChatProblem;
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(problem.url);
      setCopied(true);
      toast.success('Problem URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <a
      href={problem.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-all bg-secondary/40 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-mono">
              {problem.contest_id}{problem.problem_index}
            </span>
            {problem.rating && (
              <span
                className={`text-xs font-semibold font-mono ${ratingColor(problem.rating)}`}
              >
                {problem.rating}
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {problem.name}
          </h4>
          {problem.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {problem.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-accent border border-border/50 text-muted-foreground rounded"
                >
                  {tag}
                </span>
              ))}
              {problem.tags.length > 4 && (
                <span className="text-xs text-muted-foreground">+{problem.tags.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
          <button
            onClick={handleCopyUrl}
            className="p-1 rounded hover:bg-accent transition-colors"
            title="Copy problem URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            )}
          </button>
          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
        </div>
      </div>
      {problem.solved_count > 0 && (
        <div className="text-xs text-muted-foreground mt-1.5">
          Solved by {problem.solved_count.toLocaleString()}
        </div>
      )}
    </a>
  );
}
