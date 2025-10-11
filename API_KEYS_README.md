# Vaelix Bank API - API Keys System

## Overview

The Vaelix Bank API implements a dual-key authentication system with two types of API keys:

- **Client Keys**: For client applications and end-user integrations
- **Server Keys**: For server-to-server communications and administrative operations

## API Key Structure

Each API key consists of:
- `key`: Public identifier (32-character hex string)
- `secret`: Private secret (64-character hex string) - returned only on creation
- `type`: Either 'client' or 'server'
- `user_id`: Associated user ID
- `description`: Optional description
- `expires_at`: Optional expiration date
- `created_at`: Creation timestamp

## Authentication

API requests must include both key and secret in headers:

```
x-api-key: your_api_key_here
x-api-secret: your_api_secret_here
```

Or alternatively:

```
api_key: your_api_key_here
api_secret: your_api_secret_here
```

## Endpoints

### Public Endpoints

#### Validate API Key
- **POST** `/api/keys/validate`
- **Body**: `{ "key": "string", "secret": "string" }`
- **Response**: Key validation status and metadata

### Protected Endpoints (Require Server Key)

#### List All API Keys
- **GET** `/api/keys`
- Requires server key authentication

#### Get User API Keys
- **GET** `/api/keys/user/:userId`
- Requires server key authentication

#### Create API Key
- **POST** `/api/keys`
- **Body**:
  ```json
  {
    "user_id": 123,
    "type": "client" | "server",
    "description": "Optional description",
    "expires_at": "2024-12-31T23:59:59Z" // Optional
  }
  ```
- **Response**: Created key with secret (secret returned only once)
- Requires server key authentication

#### Update API Key
- **PATCH** `/api/keys/:id`
- **Body**:
  ```json
  {
    "description": "Updated description",
    "expires_at": "2024-12-31T23:59:59Z"
  }
  ```
- Requires server key authentication

#### Delete API Key
- **DELETE** `/api/keys/:id`
- Requires server key authentication

## Usage Examples

### Creating a Client API Key

```bash
curl -X POST https://api.vaelixbank.com/api/keys \
  -H "x-api-key: server_key_here" \
  -H "x-api-secret: server_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "type": "client",
    "description": "Mobile app key",
    "expires_at": "2024-12-31T23:59:59Z"
  }'
```

### Using API Key for Authentication

```bash
curl -X GET https://api.vaelixbank.com/api/accounts/db \
  -H "x-api-key: client_key_here" \
  -H "x-api-secret: client_secret_here"
```

## Security Notes

- **Never expose API secrets** in client-side code or logs
- **Rotate keys regularly** for security
- **Use server keys only for server-to-server** communications
- **Set expiration dates** for temporary access
- API secrets are hashed and stored securely in the database
- Failed authentication attempts are logged for security monitoring

## Database Migration

To add the required fields to existing installations, run the migration script:

```sql
-- Located in data/migration_add_api_key_fields.sql
ALTER TABLE api_keys
ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'client' CHECK (type IN ('client', 'server')),
ADD COLUMN expires_at TIMESTAMP;
```

## Integration with Existing Routes

Existing routes can be protected by adding the authentication middleware:

```typescript
import { authenticateApiKey, requireServerKey, requireClientKey } from '../middleware/apiKeyAuth';

// Require any valid API key
router.use(authenticateApiKey);

// Require specifically server key
router.use(requireServerKey);

// Require specifically client key
router.use(requireClientKey);
```