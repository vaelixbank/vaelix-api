# Vaelix Bank API Models

This document describes the data models used in the Vaelix Bank API. Models are divided into database models (stored in PostgreSQL) and API interfaces (for external integrations like Weavr).

## Core Models

### User

Represents a user in the system.

**Database Model:**
- `id`: number - Primary key
- `email`: string - User email
- `full_name`: string - Full name
- `phone?`: string - Phone number (optional)
- `kyc_status?`: string - KYC verification status (optional)
- `created_at`: Date
- `updated_at`: Date

**API Interfaces:**
- `AuthorisedUser` - Weavr user representation
- `KycStatus` - KYC verification details
- `UserInvite` - User invitation data
- `CreateUserRequest` / `UpdateUserRequest` - Request payloads

### Account

Represents a bank account.

**Database Model:**
- `id`: number - Primary key
- `user_id`: number - Owner user ID
- `account_number?`: string - Account number (optional)
- `account_type?`: string - Account type (optional)
- `currency`: string - Account currency
- `balance`: number - Current balance
- `status`: string - Account status
- `created_at`: Date
- `updated_at`: Date

**API Interfaces:**
- `ManagedAccount` - Weavr managed account
- `ManagedAccountStatement` - Account statement with transactions
- `CreateManagedAccountRequest` / `UpdateManagedAccountRequest` - Account management requests

### Transaction

Represents financial transactions.

**Database Model:**
- `id`: number - Primary key
- `account_id`: number - Associated account ID
- `amount`: number - Transaction amount
- `currency`: string - Transaction currency
- `type?`: string - Transaction type (optional)
- `status`: string - Transaction status
- `description?`: string - Description (optional)
- `created_at`: Date
- `updated_at`: Date

**API Interfaces:**
- `SendTransaction` - Send money transaction
- `TransferTransaction` - Transfer between accounts
- `OutgoingWireTransfer` - Wire transfer to external account
- `CreateSendRequest` / `CreateTransferRequest` / `CreateOutgoingWireTransferRequest` - Transaction creation requests
- `BulkSendRequest` / `BulkTransferRequest` / `BulkOutgoingWireTransferRequest` - Bulk transaction requests

### Card

Represents payment cards.

**API Interfaces:**
- `ManagedCard` - Weavr managed card
- `SpendRules` / `SpendRule` - Card spending rules and conditions
- `PhysicalCardUpgradeRequest` - Physical card upgrade
- `PhysicalCardActivationRequest` - Card activation
- `CardReplacementRequest` - Card replacement
- `ManagedCardStatement` - Card statement
- `CardTransaction` - Individual card transaction

### Authentication

Handles user authentication and sessions.

**Key Interfaces:**
- `LoginRequest` - Standard login
- `BiometricLoginRequest` - Biometric authentication
- `AuthToken` - Authentication tokens
- `UserIdentity` - User identity information
- `MobileUser` - Mobile app user
- `MobileLoginRequest` / `MobileRegisterRequest` - Mobile authentication
- `AuthTokens` - Mobile authentication tokens
- `Session` - User session data
- `WeavrAuthResponse` - Weavr authentication response

## Other Models

The API includes additional models for various banking features:

### Compliance & Security
- `AmlFlag` - Anti-Money Laundering flags
- `FraudDetection` - Fraud detection data
- `SecurityIncident` - Security incidents
- `AuditLog` / `AuditPolicy` - Audit trails
- `LoginAttempt` - Login attempt tracking

### Financial Products
- `Loan` - Loan accounts
- `Saving` - Savings accounts
- `Investment` - Investment portfolios
- `WealthPortfolio` - Wealth management
- `InsuranceContract` - Insurance policies

### Regulatory & Reporting
- `RegulatoryReport` - Regulatory compliance reports
- `TransactionLimits` - Transaction limits
- `TransactionAudit` - Transaction audit logs

### Business Entities
- `Beneficiary` - Payment beneficiaries
- `MerchantProfile` - Merchant profiles
- `PartnerBank` - Partner bank integrations
- `BoardMember` - Corporate board members

### Operational
- `ApiKey` - API key management
- `Notification` - User notifications
- `SupportTicket` - Support tickets
- `Bulk` - Bulk operation data

### Technical
- `Session` - User sessions
- `ProtocolVersion` - API protocol versions
- `FxRates` - Foreign exchange rates
- `LedgerSnapshot` - Ledger snapshots

For detailed field definitions of specific models, refer to the corresponding TypeScript interface files in `app/models/`.