// ============================================
// Vaelix Bank Admin Dashboard Types
// ============================================

export interface AdminUser {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  kyc_status: string;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
  roles: string[];
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  account_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  blocked_balance: number;
  reserved_balance: number;
  status: string;
  iban?: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface Transaction {
  id: string;
  account_id: number;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description?: string;
  created_at: string;
  account?: {
    account_number: string;
    user: {
      full_name: string;
    };
  };
}

export interface ApiKey {
  id: number;
  user_id: number;
  key: string;
  type: string;
  description?: string;
  expires_at?: string;
  created_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  object_type: string;
  object_id: number;
  timestamp: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface AmlFlag {
  id: number;
  user_id: number;
  transaction_id?: string;
  reason: string;
  flagged_at: string;
  user?: {
    email: string;
    full_name: string;
  };
}

export interface RegulatoryReport {
  id: number;
  report_type: string;
  report_subtype?: string;
  status: string;
  submitted_at?: string;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  totalBalance: number;
  pendingKyc: number;
  amlFlags: number;
  activeApiKeys: number;
  recentTransactions: Transaction[];
}

export interface ApiMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgResponseTime: number;
  }>;
  recentErrors: Array<{
    timestamp: string;
    endpoint: string;
    error: string;
    statusCode: number;
  }>;
}

// Navigation types
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface UserForm {
  email: string;
  full_name: string;
  phone?: string;
  kyc_status: string;
  password?: string;
}

export interface AccountForm {
  user_id: number;
  account_number: string;
  account_type: string;
  currency: string;
  initial_balance?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter and search types
export interface UserFilters {
  kyc_status?: string;
  is_verified?: boolean;
  role?: string;
  search?: string;
}

export interface TransactionFilters {
  account_id?: number;
  type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
}

export interface AuditFilters {
  user_id?: number;
  action?: string;
  object_type?: string;
  date_from?: string;
  date_to?: string;
}