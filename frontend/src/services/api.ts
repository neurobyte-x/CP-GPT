import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type {
  ChatResponse,
  CoachingRequest,
  CoachingResponse,
  Conversation,
  ConversationDetail,
  CreatePathRequest,
  DashboardStats,
  LoginRequest,
  PathDetail,
  PracticePath,
  ProblemFilters,
  ProblemListResponse,
  RegisterRequest,
  Tag,
  TokenResponse,
  TopicStats,
  User,
  UserProgress,
} from '@/types';

const getBaseUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl && apiBaseUrl.startsWith('http')) {
    return `${apiBaseUrl}/api/v1`;
  }
  return '/api/v1';
};

const BASE_URL = getBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && !error.config?._retry) {
          error.config._retry = true;
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  async register(data: RegisterRequest): Promise<User> {
    const resp = await this.client.post('/auth/register', data);
    return resp.data;
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', data.email);
    formData.append('password', data.password);

    const resp = await this.client.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokens: TokenResponse = resp.data;
    localStorage.setItem('access_token', tokens.access_token);
    return tokens;
  }

  logout(): void {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }

  async getMe(): Promise<User> {
    const resp = await this.client.get('/users/me');
    return resp.data;
  }

  async updateMe(data: Partial<User>): Promise<User> {
    const resp = await this.client.patch('/users/me', data);
    return resp.data;
  }

  async syncCF(): Promise<Record<string, unknown>> {
    const resp = await this.client.post('/users/me/sync-cf');
    return resp.data;
  }

  async getDashboard(): Promise<DashboardStats> {
    const resp = await this.client.get('/users/me/dashboard');
    return resp.data;
  }

  async getWeakTopics(topN = 5): Promise<Array<{ tag_id: number; estimated_skill: number; problems_solved: number }>> {
    const resp = await this.client.get('/users/me/weak-topics', { params: { top_n: topN } });
    return resp.data;
  }

  async getProblems(filters: ProblemFilters = {}): Promise<ProblemListResponse> {
    const resp = await this.client.get('/problems', { params: filters });
    return resp.data;
  }

  async getTags(): Promise<Tag[]> {
    const resp = await this.client.get('/problems/tags');
    return resp.data;
  }

  async getProblem(id: number): Promise<import('@/types').Problem> {
    const resp = await this.client.get(`/problems/${id}`);
    return resp.data;
  }

  async createPath(data: CreatePathRequest): Promise<PracticePath> {
    const resp = await this.client.post('/paths', data);
    return resp.data;
  }

  async listPaths(status?: string): Promise<{ paths: PracticePath[]; total: number }> {
    const resp = await this.client.get('/paths', { params: status ? { status_filter: status } : {} });
    return resp.data;
  }

  async getPath(id: string): Promise<PathDetail> {
    const resp = await this.client.get(`/paths/${id}`);
    return resp.data;
  }

  async updatePath(id: string, data: { name?: string; status?: string }): Promise<PracticePath> {
    const resp = await this.client.patch(`/paths/${id}`, data);
    return resp.data;
  }

  async deletePath(id: string): Promise<void> {
    await this.client.delete(`/paths/${id}`);
  }

  async markSolved(pathId: string, problemId: number, timeSpent = 0, hintsUsed = 0): Promise<Record<string, unknown>> {
    const resp = await this.client.post(`/paths/${pathId}/solve`, {
      path_id: pathId,
      problem_id: problemId,
      time_spent_seconds: timeSpent,
      hints_used: hintsUsed,
    });
    return resp.data;
  }

  async skipProblem(pathId: string, position: number): Promise<Record<string, unknown>> {
    const resp = await this.client.post(`/paths/${pathId}/skip/${position}`);
    return resp.data;
  }

  async listProgress(status?: string, page = 1): Promise<UserProgress[]> {
    const resp = await this.client.get('/progress', { params: { status_filter: status, page } });
    return resp.data;
  }

  async getTopicStats(): Promise<TopicStats[]> {
    const resp = await this.client.get('/progress/topics');
    return resp.data;
  }

  async getProgressSummary(): Promise<Record<string, unknown>> {
    const resp = await this.client.get('/progress/summary');
    return resp.data;
  }

  async getCoaching(data: CoachingRequest): Promise<CoachingResponse> {
    const resp = await this.client.post('/coaching', data);
    return resp.data;
  }

  async listConversations(): Promise<Conversation[]> {
    const resp = await this.client.get('/chat/conversations');
    return resp.data;
  }

  async createConversation(title?: string): Promise<ConversationDetail> {
    const resp = await this.client.post('/chat/conversations', { title });
    return resp.data;
  }

  async getConversation(id: string): Promise<ConversationDetail> {
    const resp = await this.client.get(`/chat/conversations/${id}`);
    return resp.data;
  }

  async deleteConversation(id: string): Promise<void> {
    await this.client.delete(`/chat/conversations/${id}`);
  }

  async updateConversationTitle(id: string, title: string): Promise<Conversation> {
    const resp = await this.client.patch(`/chat/conversations/${id}`, { title });
    return resp.data;
  }

  async sendMessage(conversationId: string, message: string): Promise<ChatResponse> {
    const resp = await this.client.post(`/chat/conversations/${conversationId}/messages`, {
      message,
    });
    return resp.data;
  }
}

export const api = new ApiClient();
