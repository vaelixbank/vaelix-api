// ============================================
// Vaelix Bank Admin API Client
// ============================================

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginForm, ApiResponse, PaginatedResponse, DashboardStats, AdminUser, Account, Transaction, ApiKey, AuditLog, AmlFlag, RegulatoryReport, ApiMetrics } from '@/types/admin';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      timeout: 10000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && !this.token) {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  // Authentication
  async login(credentials: LoginForm): Promise<{ token: string; user: AdminUser }> {
    const response = await this.client.post('/api/admin/auth/login', credentials);
    const { token, user } = response.data;
    this.setToken(token);
    return { token, user };
  }

  async getCurrentUser(): Promise<AdminUser> {
    const response = await this.client.get('/api/admin/auth/me');
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get('/api/admin/dashboard/stats');
    return response.data;
  }

  // Users Management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    kyc_status?: string;
    is_verified?: boolean;
  }): Promise<PaginatedResponse<AdminUser>> {
    const response = await this.client.get('/api/admin/users', { params });
    return response.data;
  }

  async getUserById(id: number): Promise<AdminUser> {
    const response = await this.client.get(`/api/admin/users/${id}`);
    return response.data;
  }

  async createUser(userData: Partial<AdminUser>): Promise<AdminUser> {
    const response = await this.client.post('/api/admin/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: Partial<AdminUser>): Promise<AdminUser> {
    const response = await this.client.put(`/api/admin/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await this.client.delete(`/api/admin/users/${id}`);
  }

  // Accounts Management
  async getAccounts(params?: {
    page?: number;
    limit?: number;
    user_id?: number;
    status?: string;
  }): Promise<PaginatedResponse<Account>> {
    const response = await this.client.get('/api/admin/accounts', { params });
    return response.data;
  }

  async getAccountById(id: number): Promise<Account> {
    const response = await this.client.get(`/api/admin/accounts/${id}`);
    return response.data;
  }

  async updateAccountStatus(id: number, status: string): Promise<Account> {
    const response = await this.client.patch(`/api/admin/accounts/${id}/status`, { status });
    return response.data;
  }

  // Transactions
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    account_id?: number;
    type?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<Transaction>> {
    const response = await this.client.get('/api/admin/transactions', { params });
    return response.data;
  }

  async getTransactionById(id: string): Promise<Transaction> {
    const response = await this.client.get(`/api/admin/transactions/${id}`);
    return response.data;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const response = await this.client.patch(`/api/admin/transactions/${id}/status`, { status });
    return response.data;
  }

  // API Keys
  async getApiKeys(params?: {
    page?: number;
    limit?: number;
    user_id?: number;
    type?: string;
  }): Promise<PaginatedResponse<ApiKey>> {
    const response = await this.client.get('/api/admin/api-keys', { params });
    return response.data;
  }

  async createApiKey(apiKeyData: Partial<ApiKey>): Promise<ApiKey> {
    const response = await this.client.post('/api/admin/api-keys', apiKeyData);
    return response.data;
  }

  async deleteApiKey(id: number): Promise<void> {
    await this.client.delete(`/api/admin/api-keys/${id}`);
  }

  // Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.client.get('/api/admin/audit-logs', { params });
    return response.data;
  }

  // Compliance
  async getAmlFlags(params?: {
    page?: number;
    limit?: number;
    user_id?: number;
    resolved?: boolean;
  }): Promise<PaginatedResponse<AmlFlag>> {
    const response = await this.client.get('/api/admin/compliance/aml-flags', { params });
    return response.data;
  }

  async resolveAmlFlag(id: number, resolution: string): Promise<AmlFlag> {
    const response = await this.client.patch(`/api/admin/compliance/aml-flags/${id}/resolve`, { resolution });
    return response.data;
  }

  async getRegulatoryReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    report_type?: string;
  }): Promise<PaginatedResponse<RegulatoryReport>> {
    const response = await this.client.get('/api/admin/compliance/regulatory-reports', { params });
    return response.data;
  }

  // API Monitoring
  async getApiMetrics(period?: string): Promise<ApiMetrics> {
    const response = await this.client.get('/api/admin/monitoring/metrics', { params: { period } });
    return response.data;
  }

  async getApiLogs(params?: {
    page?: number;
    limit?: number;
    endpoint?: string;
    status_code?: number;
    date_from?: string;
    date_to?: string;
  }): Promise<PaginatedResponse<any>> {
    const response = await this.client.get('/api/admin/monitoring/logs', { params });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;