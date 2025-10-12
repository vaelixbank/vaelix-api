# Mobile API Integration Guide (TypeScript)

This guide provides comprehensive instructions for integrating the Vaelix Bank mobile API into your TypeScript-based mobile application (React Native). It covers authentication, account management, card operations, and transaction handling with full TypeScript type definitions and examples.

## Table of Contents

1. [Authentication](#authentication)
2. [Account Management](#account-management)
3. [Card Management](#card-management)
4. [Transaction Management](#transaction-management)
5. [Security Best Practices](#security-best-practices)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)

## Base Configuration

```typescript
// Configuration constants
const API_BASE_URL: string = 'https://api.vaelixbank.com'; // Production
// const API_BASE_URL: string = 'http://localhost:3000'; // Development

const API_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-device-id': 'your-unique-device-id', // Will be set dynamically
};

// API endpoints
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/mobile/login',
    LOGOUT: '/api/auth/mobile/logout',
    REFRESH: '/api/auth/mobile/refresh',
    REGISTER: '/api/auth/mobile/register',
    PROFILE: '/api/auth/mobile/profile',
    VERIFY_SEND: '/api/auth/mobile/verify/send',
    VERIFY: '/api/auth/mobile/verify',
    PASSWORD_RESET: '/api/auth/mobile/password-reset',
    PASSWORD_RESET_CONFIRM: '/api/auth/mobile/password-reset/confirm',
  },
  ACCOUNTS: {
    USER_ACCOUNTS: (userId: number) => `/api/accounts/db/user/${userId}`,
    ACCOUNT_BALANCE: (accountId: number) => `/api/accounts/db/${accountId}/balance`,
    ACCOUNT_TRANSACTIONS: (accountId: number) => `/api/accounts/db/${accountId}/transactions`,
  },
  CARDS: '/api/cards',
  TRANSACTIONS: '/api/transactions',
} as const;

// Error codes
const ERROR_CODES = {
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_EXISTS: 'USER_EXISTS',
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
  MISSING_DEVICE_ID: 'MISSING_DEVICE_ID',
  INVALID_DEVICE_ID: 'INVALID_DEVICE_ID',
} as const;
```

## Authentication

### Device ID Generation

Generate a unique device identifier for each installation:

```typescript
// React Native (TypeScript)
import DeviceInfo from 'react-native-device-info';

const getDeviceId = async (): Promise<string> => {
  try {
    return await DeviceInfo.getUniqueId();
  } catch (error) {
    console.error('Failed to get device ID:', error);
    // Fallback to a generated UUID if device info fails
    return generateFallbackId();
  }
};

const generateFallbackId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Usage
const deviceId = await getDeviceId();
```

### User Registration

Register a new user account:

**Endpoint:** `POST /api/auth/mobile/register`

**Request:**
```json
{
  "email": "user@example.com",
  "phone": "+33123456789",
  "full_name": "John Doe",
  "password": "securepassword123",
  "device_id": "device-uuid-here",
  "device_info": {
    "platform": "ios",
    "version": "14.5",
    "model": "iPhone12,1"
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please verify your email.",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_verified": false
  },
  "requires_verification": true
}
```

### Email/Phone Verification

Send verification code:

**Endpoint:** `POST /api/auth/mobile/verify/send`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "type": "email"
}
```

Verify the code:

**Endpoint:** `POST /api/auth/mobile/verify`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "code": "123456",
  "type": "email"
}
```

### User Login

Login with email and optional password:

**Endpoint:** `POST /api/auth/mobile/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123", // Optional for passwordless login
  "device_id": "device-uuid-here",
  "device_info": {
    "platform": "ios",
    "version": "14.5",
    "model": "iPhone12,1"
  }
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900,
  "session_id": "session-uuid",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+33123456789",
    "is_verified": true,
    "kyc_status": "approved",
    "device_id": "device-uuid-here",
    "last_login": "2024-01-15T10:30:00Z"
  }
}
```

### Token Refresh

Refresh expired access tokens:

**Endpoint:** `POST /api/auth/mobile/refresh`

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "new-access-token",
  "refresh_token": "new-refresh-token",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": { ... }
}
```

### Logout

Logout and invalidate session:

**Endpoint:** `POST /api/auth/mobile/logout`

**Headers:**
```
Authorization: Bearer <access_token>
x-session-id: <session_id>
```

### Password Reset

Request password reset:

**Endpoint:** `POST /api/auth/mobile/password-reset`

**Request:**
```json
{
  "email": "user@example.com"
}
```

Confirm password reset:

**Endpoint:** `POST /api/auth/mobile/password-reset/confirm`

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "newsecurepassword123"
}
```

## Account Management

### Get User Profile

**Endpoint:** `GET /api/auth/mobile/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": 123,
    "email": "user@example.com",
    "full_name": "John Doe",
    "phone": "+33123456789",
    "is_verified": true,
    "kyc_status": "approved",
    "device_id": "device-uuid-here",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-15T10:30:00Z"
  }
}
```

### Get User Accounts

**Endpoint:** `GET /api/accounts/db/user/:userId`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <server_api_key>
```

**Response:**
```json
[
  {
    "id": 456,
    "user_id": 123,
    "account_number": "FR1234567890123456789012345",
    "account_type": "checking",
    "currency": "EUR",
    "balance": 2500.50,
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### Get Account Balance

**Endpoint:** `GET /api/accounts/db/:accountId/balance`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <server_api_key>
```

**Response:**
```json
{
  "account_id": 456,
  "balance": 2500.50,
  "currency": "EUR",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

### Get Account Transactions

**Endpoint:** `GET /api/accounts/db/:accountId/transactions?limit=20&offset=0`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <server_api_key>
```

**Response:**
```json
[
  {
    "id": 789,
    "account_id": 456,
    "amount": -50.00,
    "currency": "EUR",
    "type": "debit",
    "status": "completed",
    "description": "ATM withdrawal",
    "created_at": "2024-01-15T09:00:00Z",
    "updated_at": "2024-01-15T09:00:00Z"
  }
]
```

## Card Management

### Get User Cards

**Endpoint:** `GET /api/cards`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Response:**
```json
[
  {
    "id": "card-uuid",
    "profile_id": "profile-uuid",
    "name": "Main Card",
    "state": "active",
    "type": "virtual",
    "brand": "visa",
    "currency": "EUR",
    "balance": {
      "available": 1200.00,
      "blocked": 0.00,
      "reserved": 50.00
    },
    "masked_pan": "411111******1111",
    "expiry_date": "12/26",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
]
```

### Create Virtual Card

**Endpoint:** `POST /api/cards`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Request:**
```json
{
  "profile_id": "profile-uuid",
  "name": "New Virtual Card",
  "type": "virtual",
  "brand": "visa",
  "currency": "EUR"
}
```

### Block/Unblock Card

**Endpoint:** `POST /api/cards/:cardId/block`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Endpoint:** `POST /api/cards/:cardId/unblock`

### Get Card Statement

**Endpoint:** `GET /api/cards/:cardId/statement?from_date=2024-01-01&to_date=2024-01-31`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Response:**
```json
{
  "id": "statement-uuid",
  "card_id": "card-uuid",
  "from_date": "2024-01-01",
  "to_date": "2024-01-31",
  "transactions": [
    {
      "id": "txn-uuid",
      "type": "debit",
      "amount": 25.50,
      "currency": "EUR",
      "description": "Coffee Shop",
      "merchant": {
        "name": "Starbucks",
        "category": "Food & Beverage",
        "country": "FR"
      },
      "created_at": "2024-01-10T14:30:00Z"
    }
  ],
  "balance": {
    "opening": 1250.00,
    "closing": 1200.00
  }
}
```

## Transaction Management

### Send Money

**Endpoint:** `POST /api/transactions/send`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Request:**
```json
{
  "profile_id": "profile-uuid",
  "source": {
    "type": "managed_account",
    "id": "account-uuid"
  },
  "destination": {
    "type": "beneficiary",
    "id": "beneficiary-uuid"
  },
  "amount": 100.00,
  "currency": "EUR",
  "description": "Payment for services"
}
```

### Transfer Between Accounts

**Endpoint:** `POST /api/transactions/transfer`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Request:**
```json
{
  "profile_id": "profile-uuid",
  "source": {
    "type": "managed_account",
    "id": "source-account-uuid"
  },
  "destination": {
    "type": "managed_account",
    "id": "destination-account-uuid"
  },
  "amount": 50.00,
  "currency": "EUR",
  "description": "Transfer to savings"
}
```

### Get Transaction History

**Endpoint:** `GET /api/transactions`

**Headers:**
```
Authorization: Bearer <access_token>
x-api-key: <api_key>
auth_token: <auth_token>
```

**Response:**
```json
[
  {
    "id": "txn-uuid",
    "profile_id": "profile-uuid",
    "state": "completed",
    "type": "send",
    "source": {
      "type": "managed_account",
      "id": "account-uuid"
    },
    "destination": {
      "type": "beneficiary",
      "id": "beneficiary-uuid"
    },
    "amount": 100.00,
    "currency": "EUR",
    "description": "Payment for services",
    "created_at": "2024-01-15T10:00:00Z",
    "completed_at": "2024-01-15T10:00:05Z"
  }
]
```

## Security Best Practices

### Token Storage

**React Native (TypeScript):**
```typescript
import * as SecureStore from 'expo-secure-store';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId?: string;
}

class TokenManager {
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly sessionIdKey = 'session_id';

  async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.accessTokenKey, tokens.accessToken);
      await SecureStore.setItemAsync(this.refreshTokenKey, tokens.refreshToken);
      if (tokens.sessionId) {
        await SecureStore.setItemAsync(this.sessionIdKey, tokens.sessionId);
      }
    } catch (error) {
      console.error('Failed to save tokens:', error);
      throw new Error('Token storage failed');
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.accessTokenKey);
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.refreshTokenKey);
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  async getSessionId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.sessionIdKey);
    } catch (error) {
      console.error('Failed to get session ID:', error);
      return null;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.accessTokenKey);
      await SecureStore.deleteItemAsync(this.refreshTokenKey);
      await SecureStore.deleteItemAsync(this.sessionIdKey);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  async hasValidTokens(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    return !!(accessToken && refreshToken);
  }
}
```

### Automatic Token Refresh

```typescript
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private tokenManager: TokenManager;

  constructor(baseURL: string = 'https://api.vaelixbank.com') {
    this.baseURL = baseURL;
    this.tokenManager = new TokenManager();
  }

  private async getDeviceId(): Promise<string> {
    // Implementation from device ID generation section
    return await getDeviceId();
  }

  async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const deviceId = await this.getDeviceId();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-device-id': deviceId,
      ...options.headers
    };

    // Add auth header if available
    const accessToken = await this.tokenManager.getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers
      });

      // Handle token expiration
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const newAccessToken = await this.tokenManager.getAccessToken();
          if (newAccessToken) {
            headers['Authorization'] = `Bearer ${newAccessToken}`;
            response = await fetch(url, { ...options, headers });
          }
        }
      }

      const data = await response.json();

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error,
        status: response.status
      };
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = await this.tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const deviceId = await this.getDeviceId();
      const response = await fetch(`${this.baseURL}/api/auth/mobile/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': deviceId
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        await this.tokenManager.saveTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          sessionId: data.session_id
        });
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }
}
```

### Certificate Pinning

Implement SSL certificate pinning for production apps to prevent man-in-the-middle attacks.

### Request Signing

For additional security, implement request signing for sensitive operations.

## Error Handling

### Common Error Codes

- `MISSING_TOKEN`: Access token required
- `INVALID_TOKEN`: Token is invalid or expired
- `INVALID_CREDENTIALS`: Wrong email/password
- `USER_EXISTS`: User already registered
- `ACCOUNT_NOT_VERIFIED`: Email/phone verification required
- `MISSING_DEVICE_ID`: Device ID not provided
- `INVALID_DEVICE_ID`: Device ID format invalid

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific field error"
  }
}
```

### Network Error Handling

```typescript
interface ApiErrorDetails {
  error: string;
  code: string;
  details?: Record<string, any>;
}

class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: Record<string, any>;

  constructor(message: string, code: string, status: number, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

class NetworkError extends Error {
  constructor(message: string = 'No internet connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

async function apiCall<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.makeRequest<T>(endpoint, options);

    if (response.status >= 400) {
      const errorData: ApiErrorDetails = response.data || { error: 'Unknown error', code: 'UNKNOWN' };
      throw new ApiError(errorData.error, errorData.code, response.status, errorData.details);
    }

    return response.data!;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      throw new NetworkError('No internet connection');
    }

    if (error instanceof ApiError) {
      // API error
      handleApiError(error);
    } else {
      // Unknown error
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}

function handleApiError(error: ApiError): void {
  switch (error.code) {
    case ERROR_CODES.INVALID_TOKEN:
    case ERROR_CODES.MISSING_TOKEN:
      // Redirect to login or refresh token
      console.warn('Authentication error:', error.message);
      // Implement token refresh or logout logic
      break;
    case ERROR_CODES.INVALID_CREDENTIALS:
      // Show login error
      console.error('Invalid credentials:', error.message);
      break;
    case ERROR_CODES.ACCOUNT_NOT_VERIFIED:
      // Prompt user to verify account
      console.warn('Account not verified:', error.message);
      break;
    default:
      // Generic error handling
      console.error('API Error:', error.message);
  }

  // Re-throw to let caller handle it
  throw error;
}
```

## Code Examples

### React Native Authentication Hook

```typescript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_verified: boolean;
  kyc_status?: string;
  device_id: string;
  last_login?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_id?: string;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const API_BASE_URL = 'https://api.vaelixbank.com';
const API_HEADERS = {
  'Content-Type': 'application/json',
  'x-device-id': 'your-unique-device-id', // Will be set dynamically
};

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async (): Promise<void> => {
    try {
      const storedTokens = await AsyncStorage.getItem('auth_tokens');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedTokens && storedUser) {
        const parsedTokens: AuthTokens = JSON.parse(storedTokens);
        const parsedUser: User = JSON.parse(storedUser);

        setTokens(parsedTokens);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeviceId = async (): Promise<string> => {
    // Implementation from device ID generation section
    return await getDeviceId();
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${API_BASE_URL}/api/auth/mobile/login`, {
        method: 'POST',
        headers: {
          ...API_HEADERS,
          'x-device-id': deviceId
        },
        body: JSON.stringify({
          email,
          password,
          device_id: deviceId
        })
      });

      const data = await response.json();

      if (response.ok) {
        const newTokens: AuthTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          session_id: data.session_id
        };

        await AsyncStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));

        setTokens(newTokens);
        setUser(data.user);

        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (tokens?.access_token) {
        const deviceId = await getDeviceId();
        await fetch(`${API_BASE_URL}/api/auth/mobile/logout`, {
          method: 'POST',
          headers: {
            ...API_HEADERS,
            'x-device-id': deviceId,
            'Authorization': `Bearer ${tokens.access_token}`,
            'x-session-id': tokens.session_id || ''
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('auth_tokens');
      await AsyncStorage.removeItem('user_data');
      setTokens(null);
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!tokens?.refresh_token) return false;

    try {
      const deviceId = await getDeviceId();
      const response = await fetch(`${API_BASE_URL}/api/auth/mobile/refresh`, {
        method: 'POST',
        headers: {
          ...API_HEADERS,
          'x-device-id': deviceId
        },
        body: JSON.stringify({
          refresh_token: tokens.refresh_token
        })
      });

      const data = await response.json();

      if (response.ok) {
        const newTokens: AuthTokens = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          session_id: data.session_id
        };

        await AsyncStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        setTokens(newTokens);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken
  };
};
```

### TypeScript Authentication Service

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  is_verified: boolean;
  kyc_status?: string;
  device_id: string;
  last_login?: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_id?: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  session_id?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

interface Account {
  id: number;
  user_id: number;
  account_number: string;
  account_type: string;
  currency: string;
  balance: number;
  status: string;
  created_at: string;
  updated_at: string;
}

class AuthService {
  private baseUrl: string;
  private deviceId: string;

  constructor(baseUrl: string = 'https://api.vaelixbank.com') {
    this.baseUrl = baseUrl;
    this.deviceId = 'typescript-device-id'; // Should be generated uniquely
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/mobile/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
        },
        body: JSON.stringify({
          email,
          password,
          device_id: this.deviceId,
        }),
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();

        // Store tokens
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        if (data.session_id) {
          await AsyncStorage.setItem('session_id', data.session_id);
        }
        await AsyncStorage.setItem('user_data', JSON.stringify(data.user));

        return data;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Login failed');
    }
  }

  async logout(): Promise<void> {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const sessionId = await AsyncStorage.getItem('session_id');

      if (accessToken) {
        await fetch(`${this.baseUrl}/api/auth/mobile/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-device-id': this.deviceId,
            'Authorization': `Bearer ${accessToken}`,
            'x-session-id': sessionId || '',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      await AsyncStorage.removeItem('session_id');
      await AsyncStorage.removeItem('user_data');
    }
  }

  async getAccounts(): Promise<Account[]> {
    const accessToken = await AsyncStorage.getItem('access_token');
    const userData = await AsyncStorage.getItem('user_data');

    if (!accessToken || !userData) {
      throw new Error('Not authenticated');
    }

    const user: User = JSON.parse(userData);
    const userId = user.id;

    const response = await fetch(`${this.baseUrl}/api/accounts/db/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': this.deviceId,
        'Authorization': `Bearer ${accessToken}`,
        'x-api-key': 'your-server-api-key', // Required for account access
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to load accounts');
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/mobile/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-device-id': this.deviceId,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        if (data.session_id) {
          await AsyncStorage.setItem('session_id', data.session_id);
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    return false;
  }

  async isAuthenticated(): Promise<boolean> {
    const accessToken = await AsyncStorage.getItem('access_token');
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    return !!(accessToken && refreshToken);
  }
}

export default AuthService;
```

This comprehensive guide covers all aspects of mobile API integration for the Vaelix Bank platform. Follow the authentication flow carefully and implement proper error handling and security measures for production use.