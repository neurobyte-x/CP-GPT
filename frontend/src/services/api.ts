/**
 * API client — centralized HTTP layer with auth token management.
 *
 * Adapted for FastAPI-Users:
 *  - Login uses OAuth2 form data (not JSON)
 *  - No refresh tokens — just access_token
 *  - Register uses JSON body
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type {
  CoachingRequest,
  CoachingResponse,
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

const BASE_URL = '/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach auth token to every request
    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 — logout (no refresh token with FastAPI-Users)
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && !error.config?._retry) {
          error.config._retry = true;
          // No refresh flow — just clear and redirect
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  // ── Auth ────────────────────────────────────────────────────

  async register(data: RegisterRequest): Promise<User> {
    const resp = await this.client.post('/auth/register', data);
    return resp.data;
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    // FastAPI-Users uses OAuth2 form data for login
    // The "username" field is the email address
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

  // ── Users ───────────────────────────────────────────────────

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

  // ── Problems ────────────────────────────────────────────────

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

  // ── Paths ───────────────────────────────────────────────────

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

  // ── Progress ────────────────────────────────────────────────

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

  // ── Coaching ────────────────────────────────────────────────

  async getCoaching(data: CoachingRequest): Promise<CoachingResponse> {
    const resp = await this.client.post('/coaching', data);
    return resp.data;
  }
}

export const api = new ApiClient();
