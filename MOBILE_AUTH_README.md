# Vaelix Bank API - Mobile Authentication

## Overview

The mobile authentication system provides secure, stateless authentication for mobile applications without storing sensitive tokens in environment variables. It uses JWT tokens with refresh token rotation and session management.

## Architecture

### Key Components
- **JWT Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Sessions**: Server-side session tracking with device binding
- **Device Validation**: Each login is tied to a device ID
- **Verification System**: Email/SMS verification for account security

### Security Features
- Password hashing with bcrypt
- JWT token signing with separate secrets
- Automatic token expiration
- Session invalidation on logout
- Device-based session management
- Rate limiting ready (can be added)

## API Endpoints

### Authentication Routes: `/api/auth/mobile`

#### Register User
```http
POST /api/auth/mobile/register
Content-Type: application/json
X-Device-ID: device-uuid-here

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

#### Login
```http
POST /api/auth/mobile/login
Content-Type: application/json
X-Device-ID: device-uuid-here

{
  "email": "user@example.com",
  "password": "securepassword123",
  "device_id": "device-uuid-here",
  "device_info": {
    "platform": "android",
    "version": "11",
    "model": "Pixel 5"
  }
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "session_id": "session-uuid",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "full_name": "John Doe",
    "is_verified": true
  }
}
```

#### Refresh Token
```http
POST /api/auth/mobile/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /api/auth/mobile/logout
Authorization: Bearer <access_token>
X-Session-ID: session-uuid
```

#### Send Verification Code
```http
POST /api/auth/mobile/verify/send
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "email"
}
```

#### Verify Code
```http
POST /api/auth/mobile/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "code": "123456",
  "type": "email"
}
```

#### Get Profile
```http
GET /api/auth/mobile/profile
Authorization: Bearer <access_token>
```

#### Password Reset Request
```http
POST /api/auth/mobile/password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Password Reset Confirm
```http
POST /api/auth/mobile/password-reset/confirm
Content-Type: application/json

{
  "token": "reset-token-here",
  "new_password": "newsecurepassword123"
}
```

## Mobile App Integration

### Token Storage (Secure)
```typescript
// React Native example with secure storage
import * as SecureStore from 'expo-secure-store';

// Store tokens securely
await SecureStore.setItemAsync('access_token', tokens.access_token);
await SecureStore.setItemAsync('refresh_token', tokens.refresh_token);
await SecureStore.setItemAsync('session_id', sessionId);

// Retrieve tokens
const accessToken = await SecureStore.getItemAsync('access_token');
const refreshToken = await SecureStore.getItemAsync('refresh_token');
const sessionId = await SecureStore.getItemAsync('session_id');
```

### API Client Setup
```typescript
class ApiClient {
  private baseURL = 'https://api.vaelixbank.com';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    this.accessToken = await SecureStore.getItemAsync('access_token');
    this.refreshToken = await SecureStore.getItemAsync('refresh_token');
    this.sessionId = await SecureStore.getItemAsync('session_id');
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/mobile/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveTokens(data);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async saveTokens(data: any) {
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.sessionId = data.session_id;

    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    await SecureStore.setItemAsync('session_id', data.session_id || '');
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-ID': DeviceInfo.getUniqueId(),
      ...options.headers,
    };

    // Add auth header if we have a token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Add session ID if available
    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
    }

    let response = await fetch(url, { ...options, headers });

    // If unauthorized, try to refresh token
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async login(email: string, password: string) {
    const data = await this.request('/api/auth/mobile/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        device_id: DeviceInfo.getUniqueId(),
        device_info: {
          platform: Platform.OS,
          version: DeviceInfo.getVersion(),
          model: DeviceInfo.getModel()
        }
      })
    });

    await this.saveTokens(data);
    return data;
  }

  async logout() {
    try {
      await this.request('/api/auth/mobile/logout', { method: 'POST' });
    } finally {
      // Clear tokens regardless of API response
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('session_id');
      this.accessToken = null;
      this.refreshToken = null;
      this.sessionId = null;
    }
  }
}
```

## Environment Variables

Add these to your environment configuration:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database (existing)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaelixbank
DB_USER=postgres
DB_PASSWORD=your-db-password
```

## Database Migration

Run the mobile authentication migration:

```sql
-- File: data/migration_mobile_auth.sql
-- Adds required tables and columns for mobile auth
```

## Security Considerations

1. **Token Storage**: Always use secure storage on mobile devices
2. **Certificate Pinning**: Implement SSL pinning in production
3. **Biometric Authentication**: Consider adding biometric login
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Audit Logging**: Log all authentication events
6. **Token Blacklisting**: Consider implementing token blacklisting for compromised tokens

## Testing

### Register and Login Flow
```bash
# Register
curl -X POST http://localhost:3000/api/auth/mobile/register \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: test-device-123" \
  -d '{
    "email": "test@example.com",
    "phone": "+33123456789",
    "full_name": "Test User",
    "password": "password123",
    "device_id": "test-device-123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/mobile/login \
  -H "Content-Type: application/json" \
  -H "X-Device-ID: test-device-123" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "device_id": "test-device-123"
  }'
```

## Future Enhancements

- Biometric authentication
- Social login integration
- Multi-factor authentication (SMS/TOTP)
- Account recovery via security questions
- Session management dashboard
- Login notifications
- Suspicious activity detection