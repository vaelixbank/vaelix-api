# Vaelix Bank API Endpoints

This document describes the API endpoints available in the Vaelix Bank API. Endpoints are organized by functionality and include both database operations and external service integrations.

## Authentication (`/api/auth`)

### Login
- `POST /api/auth/login` - User login with password
- `POST /api/auth/login/biometric` - Biometric authentication
- `GET /api/auth/identities` - Get user identities
- `POST /api/auth/logout` - User logout
- `POST /api/auth/token` - Request access token

## Users (`/api/users`)

### Database Operations
- `GET /api/users/db` - Get all users
- `POST /api/users/db` - Create user
- `GET /api/users/db/:id` - Get user by ID
- `PATCH /api/users/db/:id` - Update user
- `DELETE /api/users/db/:id` - Delete user

### Weavr Operations
- `GET /api/users` - Get all users (Weavr)
- `POST /api/users` - Create user (Weavr)
- `GET /api/users/:id` - Get user (Weavr)
- `PATCH /api/users/:id` - Update user (Weavr)
- `POST /api/users/:id/activate` - Activate user
- `POST /api/users/:id/deactivate` - Deactivate user
- `POST /api/users/invite` - Send user invite
- `POST /api/users/invite/validate` - Validate invite
- `POST /api/users/invite/consume` - Consume invite
- `POST /api/users/:id/email/verification` - Send email verification
- `POST /api/users/:id/email/verify` - Verify email
- `POST /api/users/:id/kyc` - Start KYC process

## Accounts (`/api/accounts`)

### Database Operations
- `GET /api/accounts/db` - Get all accounts
- `GET /api/accounts/db/user/:userId` - Get user accounts
- `POST /api/accounts/db` - Create account
- `GET /api/accounts/db/:id` - Get account
- `PATCH /api/accounts/db/:id` - Update account
- `DELETE /api/accounts/db/:id` - Delete account

### Database IBAN Operations
- `POST /api/accounts/db/:id/iban` - Upgrade account with IBAN
- `GET /api/accounts/db/:id/iban` - Get account IBAN details

### Weavr Operations
- `GET /api/accounts` - Get managed accounts
- `POST /api/accounts` - Create managed account
- `GET /api/accounts/:id` - Get managed account
- `PATCH /api/accounts/:id` - Update managed account
- `POST /api/accounts/:id/block` - Block account
- `POST /api/accounts/:id/unblock` - Unblock account
- `GET /api/accounts/:id/statement` - Get account statement
- `POST /api/accounts/:id/iban` - Upgrade with IBAN
- `GET /api/accounts/:id/iban` - Get account IBAN
- `DELETE /api/accounts/:id` - Remove account

## IBAN Management

Virtual IBANs (vIBAN) enable accounts to receive and send funds via wire transfers. The IBAN management system integrates with Weavr to provide banking capabilities.

### How IBANs Work

1. **Account Creation**: When a user creates an account, it's initially stored in the local database
2. **Weavr Synchronization**: The account is synchronized with Weavr to create a managed account
3. **IBAN Assignment**: An IBAN is assigned to the managed account, enabling wire transfer capabilities
4. **Database Association**: The IBAN details are stored locally and associated with the account

### IBAN Assignment Process

#### Step 1: Create Account (Database)
```http
POST /api/accounts/db
Content-Type: application/json
x-api-key: <server_api_key>
Authorization: Bearer <access_token>

{
  "user_id": 123,
  "account_number": "FR1234567890123456789012345",
  "account_type": "checking",
  "currency": "EUR"
}
```

#### Step 2: Synchronize with Weavr
```http
POST /api/accounts
Content-Type: application/json
api_key: <weavr_api_key>
auth_token: <weavr_auth_token>

{
  "profile_id": "profile_123",
  "friendlyName": "Main Account",
  "currency": "EUR"
}
```

#### Step 3: Assign IBAN
```http
POST /api/accounts/db/{account_id}/iban
x-api-key: <weavr_api_key>
auth_token: <weavr_auth_token>
```

**Response:**
```json
{
  "message": "IBAN upgrade initiated successfully",
  "account_id": 123,
  "weavr_id": "weavr_account_456",
  "status": "processing"
}
```

#### Step 4: Retrieve IBAN Details
```http
GET /api/accounts/db/{account_id}/iban
x-api-key: <weavr_api_key>
auth_token: <weavr_auth_token>
```

**Response:**
```json
{
  "account_id": 123,
  "iban": "FR1234567890123456789012345",
  "bic": "BNPAFRPP",
  "state": "ALLOCATED"
}
```

### IBAN States

- **`UNALLOCATED`**: No IBAN assigned yet
- **`PENDING_ALLOCATION`**: IBAN assignment in progress
- **`ALLOCATED`**: IBAN is active and ready for use

### Using IBANs for Transactions

Once an IBAN is allocated, the account can:

#### Receive Funds (Incoming Wire Transfers)
```http
POST /api/transactions/wire
Content-Type: application/json
x-api-key: <weavr_api_key>
auth_token: <weavr_auth_token>

{
  "source": {
    "iban": "GB29 NWBK 6016 1331 9268 19",
    "bic": "NWBKGB2L"
  },
  "destination": {
    "iban": "FR1234567890123456789012345",
    "bic": "BNPAFRPP"
  },
  "amount": 1000.00,
  "currency": "EUR",
  "description": "Payment received"
}
```

#### Send Funds (Outgoing Wire Transfers)
```http
POST /api/transactions/wire
Content-Type: application/json
x-api-key: <weavr_api_key>
auth_token: <weavr_auth_token>

{
  "source": {
    "iban": "FR1234567890123456789012345",
    "bic": "BNPAFRPP"
  },
  "destination": {
    "iban": "GB29 NWBK 6016 1331 9268 19",
    "bic": "NWBKGB2L"
  },
  "amount": 500.00,
  "currency": "EUR",
  "description": "Payment sent"
}
```

### Database Schema

IBAN information is stored in the `accounts` table:

```sql
ALTER TABLE accounts ADD COLUMN iban VARCHAR(34);
ALTER TABLE accounts ADD COLUMN bic VARCHAR(11);
ALTER TABLE accounts ADD COLUMN weavr_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN sync_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE accounts ADD COLUMN last_weavr_sync TIMESTAMP;
```

### Error Handling

Common IBAN-related errors:

- **`ACCOUNT_NOT_SYNCED`**: Account must be synchronized with Weavr first
- **`IBAN_ALLOCATION_FAILED`**: IBAN assignment failed (retry later)
- **`INVALID_CREDENTIALS`**: Weavr API credentials are invalid
- **`INSUFFICIENT_PERMISSIONS`**: API key lacks IBAN management permissions

### Webhook Integration

IBAN status changes are automatically updated via Weavr webhooks:

```json
{
  "type": "managed_account.iban.allocated",
  "data": {
    "id": "weavr_account_456",
    "iban": "FR1234567890123456789012345",
    "bic": "BNPAFRPP"
  }
}
```

## Cards (`/api/cards`)

- `GET /api/cards` - Get managed cards
- `POST /api/cards` - Create managed card
- `GET /api/cards/:id` - Get managed card
- `PATCH /api/cards/:id` - Update managed card
- `POST /api/cards/:id/block` - Block card
- `POST /api/cards/:id/unblock` - Unblock card
- `GET /api/cards/:id/statement` - Get card statement
- `POST /api/cards/:id/upgrade` - Upgrade to physical card
- `POST /api/cards/:id/activate` - Activate physical card
- `POST /api/cards/:id/replace` - Replace card
- `DELETE /api/cards/:id` - Remove card

## Transactions (`/api/transactions`)

- `GET /api/transactions` - Get transactions
- `POST /api/transactions/send` - Send money
- `POST /api/transactions/transfer` - Transfer between accounts
- `POST /api/transactions/wire` - Outgoing wire transfer
- `GET /api/transactions/:id` - Get transaction
- `POST /api/transactions/bulk/send` - Bulk send
- `POST /api/transactions/bulk/transfer` - Bulk transfer
- `POST /api/transactions/bulk/wire` - Bulk wire transfers

## Beneficiaries (`/api/beneficiaries`)

- `GET /api/beneficiaries` - Get beneficiaries
- `POST /api/beneficiaries` - Create beneficiary
- `GET /api/beneficiaries/:id` - Get beneficiary
- `PATCH /api/beneficiaries/:id` - Update beneficiary
- `DELETE /api/beneficiaries/:id` - Delete beneficiary

## Linked Accounts (`/api/linked-accounts`)

- `GET /api/linked-accounts` - Get linked accounts
- `POST /api/linked-accounts` - Create linked account
- `GET /api/linked-accounts/:id` - Get linked account
- `PATCH /api/linked-accounts/:id` - Update linked account
- `DELETE /api/linked-accounts/:id` - Delete linked account

## Bulk Operations (`/api/bulk`)

- `POST /api/bulk/users` - Bulk user operations
- `POST /api/bulk/accounts` - Bulk account operations
- `POST /api/bulk/transactions` - Bulk transaction operations

## API Keys (`/api/keys`)

- `GET /api/keys` - Get API keys
- `POST /api/keys` - Create API key
- `GET /api/keys/:id` - Get API key
- `PATCH /api/keys/:id` - Update API key
- `DELETE /api/keys/:id` - Delete API key

## Mobile Authentication (`/api/auth/mobile`)

- `POST /api/auth/mobile/register` - Register new user
- `POST /api/auth/mobile/login` - User login
- `POST /api/auth/mobile/refresh` - Refresh access token
- `POST /api/auth/mobile/logout` - Logout user
- `POST /api/auth/mobile/verify/send` - Send verification code
- `POST /api/auth/mobile/verify` - Verify code
- `POST /api/auth/mobile/password-reset` - Request password reset
- `POST /api/auth/mobile/password-reset/confirm` - Confirm password reset
- `GET /api/auth/mobile/profile` - Get user profile

## Password Management (`/api/passwords`)

- `POST /api/passwords/reset` - Request password reset
- `POST /api/passwords/reset/confirm` - Confirm password reset
- `POST /api/passwords/change` - Change password

## SCA (Strong Customer Authentication) (`/api/sca`)

- `POST /api/sca/challenge` - Create SCA challenge
- `POST /api/sca/verify` - Verify SCA challenge
- `GET /api/sca/:id` - Get SCA challenge

## Corporates (`/api/corporates`)

- `GET /api/corporates` - Get corporate users
- `POST /api/corporates` - Create corporate user
- `GET /api/corporates/:id` - Get corporate user
- `PATCH /api/corporates/:id` - Update corporate user
- `DELETE /api/corporates/:id` - Delete corporate user

## Consumers (`/api/consumers`)

- `GET /api/consumers` - Get consumer users
- `POST /api/consumers` - Create consumer user
- `GET /api/consumers/:id` - Get consumer user
- `PATCH /api/consumers/:id` - Update consumer user
- `DELETE /api/consumers/:id` - Delete consumer user

## Authentication & Headers

### Mobile Authentication

Mobile endpoints use JWT-based authentication:

- `POST /api/auth/mobile/register` - No authentication required
- `POST /api/auth/mobile/login` - No authentication required
- `POST /api/auth/mobile/refresh` - No authentication required
- `POST /api/auth/mobile/password-reset` - No authentication required
- `POST /api/auth/mobile/password-reset/confirm` - No authentication required

All other mobile endpoints require:
- `Authorization: Bearer <access_token>` header
- `x-device-id: <device_id>` header

### Weavr API Authentication

Weavr-integrated endpoints require:
- `x-api-key` or `api_key` header
- `authorization` or `auth_token` header (for authenticated requests)

### Database Operations

Database-specific endpoints require server-level API keys:
- `x-api-key: <server_api_key>` header
- `Authorization: Bearer <access_token>` header

### Device Identification

All mobile requests should include:
- `x-device-id: <unique_device_identifier>` header

## Response Format

All responses follow a consistent JSON structure:

```json
{
  "data": { ... },
  "message": "Success message",
  "status": 200
}
```

Error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

## Rate Limiting & Security

- Request logging with unique request IDs
- CORS configuration
- Helmet security headers
- Input validation and sanitization
- Error handling with appropriate status codes