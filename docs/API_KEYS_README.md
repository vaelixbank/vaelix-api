# Vaelix Bank API - API Keys System

## Overview

The Vaelix Bank API implements a three-tier authentication system with three types of API keys:

- **Client Keys**: For client applications and end-user integrations
- **Server Keys**: For server-to-server communications and administrative operations
- **Database Keys**: For direct database access and data operations

## API Key Structure

Each API key consists of:
- `key`: Public identifier (vb_ + 48-character hex string, total 51 characters)
- `secret`: Private secret (64-character hex string) - returned only on creation
- `type`: Either 'client', 'server', or 'database'
- `name`: Optional alias/name for the key (max 50 characters)
- `user_id`: Associated user ID
- `description`: Optional description
- `expires_at`: Optional expiration date
- `created_at`: Creation timestamp

## Encryption

API key secrets are encrypted using AES256-GCM encryption before storage in the database. The encryption key is stored securely as an environment variable (`ENCRYPTION_KEY`) and is never stored in the database itself.

### Environment Setup

Add the following to your `.env` file:

```bash
# 64-character hexadecimal string (32 bytes)
ENCRYPTION_KEY=c6494d72aeea79c0f50ec82e06f427d239d5d04d7629b15770e08cb8b98a9221
```

### Migration from Hashed to Encrypted Secrets

If upgrading from a previous version that used bcrypt hashing, run the migration script:

```bash
node migrate_encrypt_api_keys.js
```

**WARNING**: This migration will invalidate all existing API key secrets. Users will need to generate new keys after the migration.

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
     "type": "client" | "server" | "database",
     "name": "my-app-key", // Optional alias
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
  -H "x-api-key: vb_1234567890abcdef..." \
  -H "x-api-secret: server_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "type": "client",
    "name": "mobile-app-v1",
    "description": "Mobile app key",
    "expires_at": "2024-12-31T23:59:59Z"
  }'
```

### Creating a Database API Key

```bash
curl -X POST https://api.vaelixbank.com/api/keys \
  -H "x-api-key: vb_1234567890abcdef..." \
  -H "x-api-secret: server_secret_here" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 123,
    "type": "database",
    "name": "data-warehouse-key",
    "description": "Key for database access and data operations",
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
- **Use database keys only for direct database access** and data operations
- **Set expiration dates** for temporary access
- API secrets are encrypted with AES256-GCM and stored securely in the database
- Failed authentication attempts are logged for security monitoring
- The encryption key is stored as an environment variable and never in the database

## Database Migration

To add the required fields to existing installations, run the migration script:

```sql
-- Located in data/migration_add_api_key_fields.sql
ALTER TABLE api_keys
ADD COLUMN type VARCHAR(10) NOT NULL DEFAULT 'client' CHECK (type IN ('client', 'server')),
ADD COLUMN expires_at TIMESTAMP;

-- To add 'database' type support, run data/migration_add_database_key_type.sql
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_type_check;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_type_check
CHECK (type IN ('client', 'server', 'database'));
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

// Require specifically database key
router.use(requireDatabaseKey);
```