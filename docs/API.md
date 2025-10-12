# Vaelix Bank API Endpoints

This document describes the API endpoints available in the Vaelix Bank API. The API follows a "Ledger First" architecture where the local ledger is the single source of truth for all banking operations.

## Architecture Overview

### Ledger-First Design
All banking operations are processed through the local ledger first. External integrations (like Weavr) are used only for regulatory compliance and external connectivity.

```
Transaction Flow:
1. Client Request → 2. TransactionManager → 3. Local Ledger → 4. RegulatoryGateway (if external)
```

### Regulatory Gateway
Weavr integration is limited to compliance-required operations:
- IBAN generation and management
- External payment transmission
- Regulatory confirmation of external funds
- Anonymized compliance reporting

**All business logic, balances, and customer data remain in the local ledger.**

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

Virtual IBANs (vIBAN) enable accounts to receive and send funds via wire transfers while maintaining full control over banking data.

### Architecture: Ledger-First with Regulatory Gateway

```
┌─────────────────┐    ┌─────────────┐    ┌─────────────────┐
│  Vaelix Bank    │    │ Regulatory  │    │  Public Market  │
│  (Ledger First) │───►│ Gateway     │◄──►│  (Banks, Cards, │
│  Single Truth   │    │ (Weavr)     │    │   Wire Xfers)   │
└─────────────────┘    └─────────────┘    └─────────────────┘
```

### Process: Local Control with Regulatory Compliance

1. **Account Creation**: Account created in local ledger with full business data
2. **Regulatory Sync**: Minimal account created in Weavr for compliance only
3. **IBAN Generation**: Weavr generates IBAN through Regulatory Gateway
4. **Local Storage**: IBAN stored in local database for client access
5. **Transaction Control**: All transactions validated locally first
6. **External Transmission**: Regulatory Gateway handles external connectivity
7. **Audit Trail**: Complete transaction history maintained locally

**Key Principle**: Weavr provides regulatory infrastructure but does not store or control business data.

### IBAN Assignment Process (Ledger-First)

#### Step 1: Create Account Locally
```http
POST /api/accounts/db
Content-Type: application/json
x-api-key: <server_api_key>
Authorization: Bearer <access_token>

{
  "user_id": 123,
  "account_type": "current",
  "currency": "EUR"
}
```

#### Step 2: Create Master Account with IBAN
```http
POST /api/accounts/master
Content-Type: application/json
x-api-key: <weavr_api_key>
Authorization: Bearer <weavr_auth_token>

{
  "profile_id": "corporate_profile_123",
  "user_id": 123,
  "account_name": "Main Account",
  "currency": "EUR",
  "account_type": "current"
}
```

**Response:**
```json
{
  "local_account": {
    "id": 123,
    "balance": 1000000000000,
    "iban": "FR1234567890123456789012345",
    "bic": "BNPAFRPP"
  },
  "weavr_account": {
    "id": "weavr_account_456"
  },
  "iban_upgrade": {
    "state": "ALLOCATED"
  },
  "initial_balance_set": 1000000000000
}
```

#### Alternative: Generate IBAN Separately
```http
POST /api/regulatory/iban/generate
Content-Type: application/json
x-api-key: <api_key>
Authorization: Bearer <token>

{
  "account_id": 123,
  "country_code": "FR",
  "holder_name": "John Doe"
}
```

#### Step 3: Retrieve IBAN Details
```http
GET /api/regulatory/accounts/123/iban
x-api-key: <api_key>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "iban": "FR1234567890123456789012345",
  "bic": "BNPAFRPP"
}
```

### IBAN States

- **`UNALLOCATED`**: No IBAN assigned yet
- **`PENDING_ALLOCATION`**: IBAN assignment in progress
- **`ALLOCATED`**: IBAN is active and ready for use

### Card Data Retrieval (CVC, PAN, Expiry)

Similar to IBANs, sensitive card data is retrieved from Weavr:

#### Create Managed Card
```http
POST /api/cards
Content-Type: application/json
api_key: <weavr_api_key>
auth_token: <weavr_auth_token>

{
  "profile_id": "profile_123",
  "name": "Virtual Card",
  "type": "virtual",
  "brand": "visa",
  "currency": "EUR"
}
```

#### Retrieve Card Details
```http
GET /api/cards/{card_id}
api_key: <weavr_api_key>
auth_token: <weavr_auth_token>
```

**Response with sensitive data:**
```json
{
  "id": "card_123",
  "profile_id": "profile_123",
  "name": "Virtual Card",
  "state": "ACTIVE",
  "type": "virtual",
  "brand": "visa",
  "currency": "EUR",
  "masked_pan": "411111******1111",
  "cvc": "123",
  "expiry_date": "12/26",
  "cardholder_name": "John Doe",
  "balances": {
    "available": 1000.00,
    "blocked": 0.00,
    "reserved": 50.00
  }
}
```

### Using IBANs for Transactions

Once an IBAN is allocated, the account can:

#### Receive Funds (Incoming Wire Transfers)
External parties can send funds to the client's IBAN:

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
Client can send funds from their IBAN to external accounts:

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

### Security & Compliance

As Weavr acts as the regulated intermediary, Vaelix Bank must ensure:

#### Data Protection
- **Encryption**: Sensitive data (IBAN, CVC) encrypted at rest and in transit
- **Access Control**: API key authentication required for all operations
- **Audit Logging**: All data access and modifications logged
- **Token Management**: Weavr auth tokens rotated regularly

#### Regulatory Compliance
- **PSD2 Compliance**: Strong Customer Authentication (SCA) implemented
- **PCI DSS**: Card data handling follows PCI DSS standards
- **GDPR**: Client data protection and consent management
- **AML/KYC**: Client verification through Weavr's regulated processes

#### Data Storage Strategy
```sql
-- Sensitive data encrypted storage
CREATE TABLE encrypted_client_data (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  data_type VARCHAR(50), -- 'iban', 'cvc', 'pan'
  encrypted_value TEXT, -- AES-256 encrypted
  weavr_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Access logging for compliance
CREATE TABLE data_access_log (
  id SERIAL PRIMARY KEY,
  client_id INTEGER,
  data_type VARCHAR(50),
  action VARCHAR(50), -- 'retrieve', 'update', 'delete'
  api_key_hash VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Webhook Integration

Weavr automatically notifies of data changes and events:

#### IBAN Allocation Webhook
```json
{
  "type": "managed_account.iban.allocated",
  "data": {
    "id": "weavr_account_456",
    "iban": "FR1234567890123456789012345",
    "bic": "BNPAFRPP",
    "state": "ALLOCATED"
  }
}
```

#### Card Data Webhook
```json
{
  "type": "managed_card.created",
  "data": {
    "id": "weavr_card_789",
    "masked_pan": "411111******1111",
    "cvc": "123",
    "expiry_date": "12/26",
    "state": "ACTIVE"
  }
}
```

#### Transaction Webhook
```json
{
  "type": "transfer.state.changed",
  "data": {
    "id": "transfer_123",
    "state": "COMPLETED",
    "amount": 100.00,
    "currency": "EUR",
    "source_iban": "FR1234567890123456789012345",
    "destination_iban": "GB29NWBK60161331926819"
  }
}
```

## Regulatory Operations (`/api/regulatory`)

The regulatory endpoints provide controlled access to Weavr for compliance-required operations only. All business logic and data management remains in the local ledger.

### Transaction Processing
- `POST /api/regulatory/transactions` - Process any transaction through central manager

**Request:**
```json
{
  "type": "internal_transfer",
  "from_account_id": 123,
  "to_account_id": 456,
  "amount": 100.00,
  "currency": "EUR",
  "description": "Internal transfer"
}
```

**Supported transaction types:**
- `internal_transfer`: Between local accounts (100% local, no Weavr)
- `external_send`: Send to external beneficiary (reserves funds locally, transmits via Weavr)
- `external_receive`: Record incoming external payment
- `balance_adjustment`: Administrative balance adjustments

### IBAN Management
- `POST /api/regulatory/iban/generate` - Generate IBAN for regulatory compliance
- `GET /api/regulatory/accounts/:account_id/iban` - Get account IBAN details

**Generate IBAN:**
```http
POST /api/regulatory/iban/generate
Content-Type: application/json
x-api-key: <api_key>
Authorization: Bearer <token>

{
  "account_id": 123,
  "country_code": "FR",
  "holder_name": "John Doe"
}
```

### External Payments
- `POST /api/regulatory/payments/send` - Send payment to external beneficiary
- `POST /api/regulatory/payments/confirm-receive` - Confirm external payment receipt

**Send External Payment:**
```http
POST /api/regulatory/payments/send
Content-Type: application/json
x-api-key: <api_key>
Authorization: Bearer <token>

{
  "from_account_id": 123,
  "amount": 500.00,
  "currency": "EUR",
  "beneficiary_details": {
    "name": "External Vendor",
    "iban": "GB29NWBK60161331926819",
    "bic": "NWBKGB2L"
  },
  "description": "Invoice payment"
}
```

**Process:**
1. Funds reserved in local ledger
2. Payment transmitted via Regulatory Gateway (Weavr)
3. Success: Transaction confirmed locally
4. Failure: Funds automatically unblocked

### Administrative Operations
- `POST /api/regulatory/balances/adjust` - Administrative balance adjustments

**Balance Adjustment:**
```http
POST /api/regulatory/balances/adjust
Content-Type: application/json
x-api-key: <server_api_key>
Authorization: Bearer <admin_token>

{
  "account_id": 123,
  "amount": 1000.00,
  "description": "Initial deposit"
}
```

## Cards (`/api/cards`)

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