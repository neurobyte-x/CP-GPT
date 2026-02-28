/**
 * Custom hooks for data fetching with React Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { CreatePathRequest, ProblemFilters, CoachingRequest } from '@/types';

// ── Problems ────────────────────────────────────────────────────

export function useProblems(filters: ProblemFilters) {
  return useQuery({
    queryKey: ['problems', filters],
    queryFn: () => api.getProblems(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProblem(id: number) {
  return useQuery({
    queryKey: ['problem', id],
    queryFn: () => api.getProblem(id),
    enabled: id > 0,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.getTags(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ── Paths ───────────────────────────────────────────────────────

export function usePaths(status?: string) {
  return useQuery({
    queryKey: ['paths', status],
    queryFn: async () => {
      const result = await api.listPaths(status);
      return result.paths;
    },
  });
}

export function usePath(id: string) {
  return useQuery({
    queryKey: ['path', id],
    queryFn: () => api.getPath(id),
    enabled: !!id,
  });
}

export function useCreatePath() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePathRequest) => api.createPath(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['paths'] });
    },
  });
}

export function useMarkSolved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { pathId: string; problemId: number; timeSpent?: number; hintsUsed?: number }) =>
      api.markSolved(params.pathId, params.problemId, params.timeSpent, params.hintsUsed),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['path', variables.pathId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSkipProblem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { pathId: string; position: number }) =>
      api.skipProblem(params.pathId, params.position),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['path', variables.pathId] });
    },
  });
}

// ── Dashboard & Progress ────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTopicStats() {
  return useQuery({
    queryKey: ['topicStats'],
    queryFn: () => api.getTopicStats(),
  });
}

// ── Coaching ────────────────────────────────────────────────────

export function useCoaching() {
  return useMutation({
    mutationFn: (data: CoachingRequest) => api.getCoaching(data),
  });
}

// ── User Actions ────────────────────────────────────────────────

export function useSyncCF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.syncCF(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['topicStats'] });
    },
  });
}

// ── Chat ────────────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.listConversations(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.getConversation(id!),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => api.createConversation(title),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { conversationId: string; message: string }) =>
      api.sendMessage(params.conversationId, params.message),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
