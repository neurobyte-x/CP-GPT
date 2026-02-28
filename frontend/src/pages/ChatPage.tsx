/**
 * ChatPage — AI Coach chat interface (dark theme).
 *
 * Layout:
 *  - Left sidebar: conversation list + new conversation button
 *  - Center: message area with auto-scroll + input bar + quick action buttons
 */

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  MessageSquarePlus,
  Send,
  Trash2,
  Loader2,
  Brain,
  MessageSquare,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import ChatMessage from '@/components/ChatMessage';
import {
  useConversations,
  useConversation,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from '@/hooks/useApi';
import { cn } from '@/lib/utils';

const STARTER_PROMPTS = [
  'Give me 5 easy greedy problems for beginners',
  'I want to improve at dynamic programming',
  'Help me reach 1400 rating on Codeforces',
  'What are my weakest topics? Suggest practice.',
  'Find sliding window problems around 1200 rating',
  'Explain two pointers technique with examples',
];

const QUICK_ACTIONS = [
  'Give me a hint',
  'Explain the approach',
  'Show time complexity',
  'Suggest similar problems',
];

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const activeId = searchParams.get('c');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if we got an initial message from Dashboard quick coach
  const initialMessage = (location.state as { initialMessage?: string } | null)?.initialMessage;

  // Queries & mutations
  const { data: conversations = [], isLoading: convLoading } = useConversations();
  const { data: activeConv, isLoading: msgLoading } = useConversation(activeId);
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const sendMsg = useSendMessage();

  const messages = activeConv?.messages || [];
  const isProcessing = sendMsg.isPending;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Focus input on conversation change
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId]);

  // Handle initial message from navigation state
  useEffect(() => {
    if (initialMessage && !activeId) {
      handleSend(initialMessage);
      // Clear the state to avoid re-sending
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const selectConversation = (id: string) => {
    setSearchParams({ c: id });
  };

  const handleNewConversation = async () => {
    try {
      const conv = await createConv.mutateAsync(undefined);
      selectConversation(conv.id);
    } catch {
      // handled by react-query
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConv.mutateAsync(id);
      if (activeId === id) {
        setSearchParams({});
      }
    } catch {
      // handled by react-query
    }
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isProcessing) return;

    let convId = activeId;

    // Auto-create conversation if none active
    if (!convId) {
      try {
        const conv = await createConv.mutateAsync(undefined);
        convId = conv.id;
        setSearchParams({ c: conv.id });
      } catch {
        return;
      }
    }

    setInput('');

    try {
      await sendMsg.mutateAsync({ conversationId: convId, message: msg });
    } catch {
      // error shown via react-query
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Conversation Sidebar ──────────────────────────────── */}
      <div className="w-64 border-r border-border/50 bg-card/50 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border/50">
          <button
            onClick={handleNewConversation}
            disabled={createConv.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.08)]"
          >
            {createConv.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquarePlus className="w-4 h-4" />
            )}
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No conversations yet.
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={cn(
                    'group flex items-center gap-2 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors',
                    activeId === conv.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-accent/50 border border-transparent',
                  )}
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {conv.title}
                    </p>
                    {conv.last_message_preview && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.last_message_preview}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive/60 hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="px-4 lg:px-6 py-3 border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Coach</h3>
              <p className="text-xs text-muted-foreground">
                {activeConv ? activeConv.title : 'Start a new conversation'}
              </p>
            </div>
          </div>
          {activeId && (
            <button
              onClick={handleNewConversation}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              title="New conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
          {!activeId ? (
            /* Empty state — show welcome + starter prompts */
            <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                CP Coach
              </h2>
              <p className="text-muted-foreground mb-8">
                Your AI competitive programming coach. Ask me to find problems,
                analyze your skills, create practice plans, or explain concepts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    disabled={isProcessing || createConv.isPending}
                    className="text-left text-sm px-4 py-3 border border-border/50 rounded-lg hover:border-primary/30 hover:bg-accent/30 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : msgLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            /* Conversation exists but no messages yet */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Brain className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                Send a message to start the conversation.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
            </>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex justify-start mb-4">
              <div className="bg-secondary/60 border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs text-primary font-semibold">AI Coach</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {activeId && (
          <div className="px-4 lg:px-6 py-2 flex gap-2 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="shrink-0 px-3 py-1.5 text-xs border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 lg:px-6 py-3 border-t border-border/50 shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the AI Coach anything..."
                rows={1}
                disabled={isProcessing}
                className="w-full resize-none rounded-xl border border-border/50 bg-secondary/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                style={{ maxHeight: '120px' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isProcessing}
              className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)]"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground/60 mt-2">
            Powered by Gemini. Responses may contain inaccuracies.
          </p>
        </div>
      </div>
    </div>
  );
}
