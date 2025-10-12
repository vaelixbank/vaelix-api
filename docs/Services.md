# Vaelix Bank API Services & Middleware

## Core Services (Ledger-First Architecture)

### TransactionManager (`app/core/TransactionManager.ts`)

**Central orchestrator for all banking transactions.** Ensures the local ledger is the single source of truth.

**Features:**
- Unified transaction processing for all types
- Local-first validation and commitment
- Atomic database operations
- Complete audit trail generation
- Automatic rollback on failures

**Transaction Types:**
- `internal_transfer`: Between local accounts (100% local)
- `external_send`: To external beneficiaries (local reserve + regulatory transmission)
- `external_receive`: From external sources (local recording + regulatory confirmation)
- `balance_adjustment`: Administrative adjustments

**Methods:**
- `processTransaction(request)` - Main transaction processing
- `confirmExternalTransaction()` - Confirm successful external transactions
- `failExternalTransaction()` - Handle external transaction failures

### RegulatoryGateway (`app/core/RegulatoryGateway.ts`)

**Limited interface to Weavr for regulatory compliance only.** Weavr acts as a regulated intermediary, not a banking platform.

**Features:**
- Controlled Weavr API access
- IBAN generation and management
- External payment transmission
- Regulatory confirmation handling
- Anonymized compliance reporting

**Authorized Operations:**
- ✅ Generate IBANs for accounts
- ✅ Transmit payments to external networks
- ✅ Confirm receipt of external funds
- ✅ Provide regulatory reports (anonymized)

**Forbidden Operations:**
- ❌ Store or manage account balances
- ❌ Process internal transactions
- ❌ Access customer business data
- ❌ Control transaction logic

**Methods:**
- `generateIBAN()` - Create regulatory IBAN
- `sendExternalPayment()` - Transmit external payment
- `confirmExternalReceive()` - Confirm external receipt
- `getAccountIBAN()` - Retrieve IBAN details
- `validateRegulatoryCompliance()` - Compliance validation

## Legacy Services (Limited Use)

### WeavrService

**Low-level HTTP client for Weavr API.** Used only by RegulatoryGateway.

**Features:**
- Axios-based HTTP client for Weavr API
- Automatic header management (API keys, auth tokens)
- Error handling and response parsing
- Timeout configuration (30 seconds)

**Methods:**
- `makeRequest(method, url, data?, apiKey?, authToken?)` - Generic API request method

### WeavrSyncService

**Legacy synchronization service.** Limited to webhook processing for regulatory confirmations.

**Features:**
- Webhook processing for external events
- Balance sync disabled for bank accounts
- Error recovery for regulatory operations
- Event-driven regulatory confirmations

### MobileAuthService

Handles mobile application authentication flows.

**Features:**
- Device-based authentication
- Biometric support
- Session management
- Token refresh handling

## Middleware

### Authentication Middleware

#### auth.ts
- `authenticate` - Validates API key and auth token headers
- Extends Request interface with authentication data

#### apiKeyAuth.ts
- `authenticateApiKey` - API key validation
- `requireServerKey` - Server-level key requirements
- Key type checking and permissions

#### mobileAuth.ts
- Mobile-specific authentication
- Device verification
- Biometric token validation

### Other Middleware

- **CORS**: Cross-origin request handling
- **Helmet**: Security headers
- **Request Logging**: Automatic request/response logging with unique IDs
- **Error Handling**: Centralized error processing
- **Validation**: Input sanitization and validation

## Utilities

### Database (database.ts)
- PostgreSQL connection pool
- Connection configuration from environment variables
- Query execution helpers

### Logger (logger.ts)
- Structured logging with multiple levels (info, warn, error, debug)
- Request ID tracking
- User ID association
- Development vs production modes

### Response Handler (response.ts)
- Standardized API response formatting
- Success and error response helpers
- Consistent JSON structure

### Validation (validation.ts)
- Input validation functions
- Field requirement checks
- Data type validation
- Custom validation rules

### Weavr Utils (weavr.ts)
- Weavr-specific error parsing
- Response formatting
- Integration helpers

## Queries

Database query modules for different entities:

- **userQueries.ts** - User CRUD operations
- **accountQueries.ts** - Account management queries
- **cardQueries.ts** - Card-related queries
- **authQueries.ts** - Authentication queries
- **beneficiaryQueries.ts** - Beneficiary operations

## Architecture Patterns

### Ledger-First Design
The system follows a strict "Ledger-First" architecture where:

1. **All transactions are validated and committed locally first**
2. **External services (Weavr) are used only for regulatory compliance**
3. **Business logic and data sovereignty remain entirely local**
4. **Regulatory Gateway provides controlled external connectivity**

**Benefits:**
- Complete data sovereignty
- Regulatory compliance without dependency
- Flexible external provider changes
- Enhanced security and auditability

### Service Layer Organization

#### Core Services (`app/core/`)
- `TransactionManager`: Central transaction orchestration
- `RegulatoryGateway`: Controlled external regulatory interface

#### Business Services (`app/services/`)
- `WeavrService`: Low-level Weavr HTTP client (used only by RegulatoryGateway)
- `WeavrSyncService`: Legacy sync service (limited to regulatory webhooks)
- `MobileAuthService`: Mobile authentication flows

### Middleware Chain
- Request preprocessing (auth, validation, logging)
- Response postprocessing (formatting, headers)
- Error interception and handling

### Regulatory Compliance Pattern
- **Local Commitment**: All business operations committed locally first
- **External Validation**: Regulatory requirements handled through dedicated gateway
- **Audit Trail**: Complete local audit trail with regulatory confirmations
- **Failure Handling**: Automatic rollback and fund protection

### Utility Functions
- Reusable helper functions
- Configuration management
- Type safety with TypeScript interfaces
- Regulatory compliance utilities