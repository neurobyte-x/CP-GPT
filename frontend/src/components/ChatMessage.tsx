/**
 * ChatMessage — renders a single message in the chat interface (dark theme).
 * User messages: right-aligned, primary tinted background.
 * Assistant messages: left-aligned with markdown rendering + problem cards.
 */

import ReactMarkdown from 'react-markdown';
import { Sparkles } from 'lucide-react';
import ProblemCard from './ProblemCard';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const problems = message.metadata_?.problems || [];

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] lg:max-w-[75%] bg-primary/15 border border-primary/20 rounded-2xl rounded-br-md px-4 py-3">
          <div className="text-sm whitespace-pre-wrap" style={{ lineHeight: 1.7 }}>
            {message.content}
          </div>
          <div className="text-[10px] text-muted-foreground/60 mt-2 text-right">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[85%] lg:max-w-[75%] space-y-3">
        {/* Text content with markdown */}
        {message.content && (
          <div className="bg-secondary/60 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-semibold">AI Coach</span>
            </div>
            <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-code:text-neon-cyan prose-code:bg-accent prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-[#0a0a0a] prose-pre:text-foreground/90 prose-pre:rounded-lg prose-pre:border prose-pre:border-border/50 prose-blockquote:border-primary/40 prose-blockquote:text-foreground/80 prose-strong:text-foreground prose-a:text-primary">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-2 text-right">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )}

        {/* Problem cards */}
        {problems.length > 0 && (
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {problems.map((p) => (
              <ProblemCard key={p.id} problem={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
