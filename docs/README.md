# Vaelix Bank API Documentation

## Overview

The Vaelix Bank API is a comprehensive banking and financial services API built with Node.js and TypeScript using the Express framework. It provides endpoints for user management, account operations, card management, transactions, and integrations with external services like Weavr.

## Architecture

The application follows a **"Ledger First" architecture** where the local ledger is the single source of truth for all banking operations. The system is designed with clear separation between core banking functions and regulatory compliance.

### Core Components

- **Core Services** (`app/core/`):
  - `TransactionManager`: Central orchestrator for all transaction types
  - `RegulatoryGateway`: Limited interface to Weavr for regulatory compliance only

- **Controllers**: Handle business logic and API responses
- **Models**: Define data structures and database schemas
- **Routes**: Define API endpoints and route handlers
- **Services**: Contain logic for external integrations and complex operations
- **Middleware**: Handle authentication, authorization, and request processing
- **Queries**: Database query functions
- **Utils**: Utility functions for logging, database connections, validation, etc.

### Architecture Principle: Ledger as Single Source of Truth

```
┌─────────────────────────────────────┐
│         Vaelix Bank API              │
│                                     │
│  ┌─────────────┐  ┌─────────────┐   │
│  │ Transaction │  │ Regulatory  │   │
│  │ Manager     │  │ Gateway     │   │
│  │ (Local Core)│  │ (External)  │   │
│  └─────────────┘  └─────────────┘   │
│         │                   │       │
│         └─────────┬─────────┘       │
│                   │                 │
│            ┌─────────────┐          │
│            │   Ledger    │          │
│            │ (PostgreSQL)│          │
│            │ Single Truth│          │
│            └─────────────┘          │
└─────────────────────────────────────┘
                    │
                    ▼
           ┌─────────────┐
           │ Regulatory  │
           │ Gateway     │
           │ (Weavr)     │
           └─────────────┘
```

**Local Ledger Controls:**
- ✅ Account balances and transactions
- ✅ Business logic and validation
- ✅ Customer data and relationships
- ✅ Internal transfers (100% local)
- ✅ Audit trails and compliance reporting

**Regulatory Gateway (Weavr) Limited to:**
- ✅ IBAN generation for compliance
- ✅ Transmission of external payments
- ✅ Reception confirmation of external funds
- ✅ Regulatory reporting (anonymized)

## Main Entry Point

The application starts from `app/index.ts`, which:

- Initializes an Express application
- Configures security middleware (Helmet)
- Sets up CORS for cross-origin requests
- Enables JSON and URL-encoded body parsing
- Implements request logging
- Mounts API routes under `/api/*`
- Provides health check endpoints
- Handles errors and 404s

## Configuration

Configuration is managed in `app/config/index.ts` with environment variables for:

- Server port (default: 3000)
- Node environment
- Weavr API base URL
- PostgreSQL database connection details
- CORS origins
- Security settings

## API Endpoints

The API provides endpoints organized by functionality:

### Core Banking Operations
- **Authentication** (`/api/auth`) - User login, logout, token management
- **Password Management** (`/api/passwords`) - Password operations and recovery
- **Strong Customer Authentication** (`/api/sca`) - SCA compliance
- **User Management** (`/api/users`, `/api/corporates`, `/api/consumers`) - User profiles and KYC
- **Accounts** (`/api/accounts`) - Account management and ledger operations
- **Cards** (`/api/cards`) - Card issuance and management
- **Beneficiaries** (`/api/beneficiaries`) - Payment beneficiary management

### Transaction Operations
- **Transactions** (`/api/transactions`) - External transaction processing
- **Bulk Operations** (`/api/bulk`) - Bulk transaction processing
- **Linked Accounts** (`/api/linked-accounts`) - External account linking

### Regulatory Compliance (New)
- **Regulatory Gateway** (`/api/regulatory`) - Limited Weavr integration for compliance
  - Transaction processing through central manager
  - IBAN generation and management
  - External payment transmission
  - Regulatory reporting

### Administrative
- **API Keys** (`/api/keys`) - API key management
- **Mobile Authentication** (`/api/auth/mobile`) - Mobile-specific auth flows

## Health Checks

- `GET /` - Basic API information
- `GET /health` - Health status with timestamp and environment info

## Security Features

- Helmet for security headers
- CORS configuration
- Request logging with unique request IDs
- Error handling with stack traces in development
- Authentication middleware
- API key authentication for certain endpoints

## External Integrations

### Regulatory Gateway (Weavr)
Weavr serves as a **regulated intermediary** for compliance-required operations only:

- **IBAN Generation**: Creates virtual IBANs for account compliance
- **External Payment Transmission**: Routes payments to public banking networks
- **Regulatory Confirmation**: Validates external fund receipts
- **Compliance Reporting**: Provides anonymized regulatory reports

**Important**: Weavr does **NOT** store business data, balances, or customer information. All core banking data remains in the local ledger.

### Database
- **PostgreSQL**: Primary data store for all banking operations
- **Ledger-First Design**: All transactions and balances managed locally
- **Audit Trails**: Complete transaction history and compliance logs

## Development

The application uses TypeScript for type safety and includes Jest for testing. Package management is handled with pnpm.

For detailed API specifications, see the [API Documentation](./API.md).

For model definitions, see the [Models Documentation](./Models.md).

For mobile application integration, see the [Mobile Integration Guide](./MOBILE_INTEGRATION.md).