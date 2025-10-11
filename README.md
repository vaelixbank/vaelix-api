# Vaelix Bank API

A banking API built on top of Weavr's Multi API, providing managed accounts and cards functionality.

## Features

- User Authentication and Password Management
- Strong Customer Authentication (SCA) with OTP and Push Notifications
- Corporate and Consumer Identity Management with KYC/KYB
- Authorised Users Management
- Beneficiary Management
- Managed Accounts and Cards
- Linked Accounts
- Transaction Processing (Sends, Transfers, Wire Transfers)
- Bulk Operations
- Production-ready with error handling and logging

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Weavr API credentials

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with password
- `POST /api/auth/login/biometric` - Login via biometrics
- `GET /api/auth/identities` - Get user identities
- `POST /api/auth/logout` - Logout
- `POST /api/auth/token` - Acquire a new access token

### Passwords
- `POST /api/passwords` - Create a password
- `POST /api/passwords/update` - Update a password
- `POST /api/passwords/validate` - Validate a password
- `POST /api/passwords/lost` - Initiate lost password process
- `POST /api/passwords/lost/resume` - Resume lost password process

### Strong Customer Authentication (SCA)
- `GET /api/sca/factors` - Get user authentication factors
- `POST /api/sca/factors/otp/enrol` - Enrol OTP authentication (step 1)
- `POST /api/sca/factors/otp/enrol/verify` - Verify OTP enrolment (step 2)
- `POST /api/sca/factors/push/enrol` - Enrol push notification authentication
- `DELETE /api/sca/factors/push/unlink` - Unlink push notification authentication
- `POST /api/sca/challenges/stepup/otp` - Issue OTP for step-up authentication
- `POST /api/sca/challenges/stepup/otp/verify` - Verify step-up OTP
- `POST /api/sca/challenges/stepup/push` - Issue push notification for step-up
- `POST /api/sca/challenges/confirmation/otp` - Issue OTP for resource confirmation
- `POST /api/sca/challenges/confirmation/otp/verify` - Verify resource confirmation OTP
- `POST /api/sca/challenges/confirmation/push` - Issue push notification for resource confirmation

### Corporates
- `POST /api/corporates` - Create a corporate
- `GET /api/corporates/:id` - Get a corporate
- `PATCH /api/corporates/:id` - Update a corporate
- `POST /api/corporates/:id/root_user/email/verification` - Send email verification code
- `POST /api/corporates/:id/root_user/email/verify` - Verify email
- `POST /api/corporates/:id/kyb/start` - Start KYB process
- `GET /api/corporates/:id/kyb` - Get KYB status
- `POST /api/corporates/:id/charge_fee` - Charge fee to corporate

### Consumers
- `POST /api/consumers` - Create a consumer
- `GET /api/consumers/:id` - Get a consumer
- `PATCH /api/consumers/:id` - Update a consumer
- `POST /api/consumers/:id/root_user/email/verification` - Send email verification code
- `POST /api/consumers/:id/root_user/email/verify` - Verify email
- `POST /api/consumers/:id/kyc/start` - Start KYC process
- `GET /api/consumers/:id/kyc` - Get KYC status
- `POST /api/consumers/:id/charge_fee` - Charge fee to consumer

### Users
- `POST /api/users` - Create a user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a user
- `PATCH /api/users/:id` - Update a user
- `POST /api/users/:id/activate` - Activate a user
- `POST /api/users/:id/deactivate` - Deactivate a user
- `POST /api/users/invite` - Send user invite
- `POST /api/users/invite/validate` - Validate user invite
- `POST /api/users/invite/consume` - Consume user invite
- `POST /api/users/:id/email/verification` - Send email verification code
- `POST /api/users/:id/email/verify` - Verify email
- `POST /api/users/:id/kyc` - Start KYC for user

### Beneficiaries
- `POST /api/beneficiaries/batch` - Add beneficiaries in batch
- `GET /api/beneficiaries` - Get all beneficiaries
- `POST /api/beneficiaries/batch/remove` - Remove beneficiaries in batch
- `GET /api/beneficiaries/:id` - Get a beneficiary
- `GET /api/beneficiaries/batch` - Get all beneficiary batches
- `GET /api/beneficiaries/batch/:id` - Get a beneficiary batch
- `POST /api/beneficiaries/batch/:id/sca/otp` - Issue OTP for beneficiary batch verification
- `POST /api/beneficiaries/batch/:id/sca/otp/verify` - Verify beneficiary batch with OTP
- `POST /api/beneficiaries/batch/:id/sca/push` - Issue push notification for beneficiary batch verification

### Accounts
- `GET /api/accounts` - Get all managed accounts
- `POST /api/accounts` - Create a managed account
- `GET /api/accounts/:id` - Get a specific account
- `PATCH /api/accounts/:id` - Update an account
- `POST /api/accounts/:id/block` - Block an account
- `POST /api/accounts/:id/unblock` - Unblock an account
- `GET /api/accounts/:id/statement` - Get account statement
- `POST /api/accounts/:id/iban` - Upgrade account with IBAN
- `GET /api/accounts/:id/iban` - Get account IBAN
- `DELETE /api/accounts/:id` - Remove an account

### Cards
- `GET /api/cards` - Get all managed cards
- `POST /api/cards` - Create a managed card
- `GET /api/cards/:id` - Get a specific card
- `PATCH /api/cards/:id` - Update a card
- `POST /api/cards/:id/block` - Block a card
- `POST /api/cards/:id/unblock` - Unblock a card
- `DELETE /api/cards/:id` - Remove a card
- `GET /api/cards/:id/statement` - Get card statement
- `POST /api/cards/:id/assign` - Assign a card
- `GET /api/cards/:id/spend-rules` - Get spend rules
- `POST /api/cards/:id/spend-rules` - Create spend rules
- `PATCH /api/cards/:id/spend-rules` - Update spend rules
- `DELETE /api/cards/:id/spend-rules` - Delete spend rules
- Physical card endpoints for upgrade, activation, PIN management, replacement, etc.

### Linked Accounts
- `POST /api/linked-accounts` - Add a linked account
- `GET /api/linked-accounts` - Get all linked accounts
- `GET /api/linked-accounts/:id` - Get a linked account
- `PATCH /api/linked-accounts/:id` - Update a linked account
- `POST /api/linked-accounts/:id/remove` - Remove a linked account
- `POST /api/linked-accounts/:id/block` - Block a linked account
- `POST /api/linked-accounts/:id/unblock` - Unblock a linked account
- `GET /api/linked-accounts/verifications` - Get linked account verifications

### Transactions
#### Sends
- `POST /api/transactions/sends` - Create a send transaction
- `GET /api/transactions/sends` - Get all send transactions
- `POST /api/transactions/sends/bulk` - Create bulk send transactions
- `POST /api/transactions/sends/cancel` - Cancel send transactions
- `GET /api/transactions/sends/:id` - Get a send transaction
- `POST /api/transactions/sends/:id/sca/otp` - Issue OTP for send verification
- `POST /api/transactions/sends/:id/sca/otp/verify` - Verify send with OTP
- `POST /api/transactions/sends/:id/sca/push` - Issue push notification for send verification

#### Transfers
- `POST /api/transactions/transfers` - Create a transfer transaction
- `GET /api/transactions/transfers` - Get all transfer transactions
- `POST /api/transactions/transfers/cancel` - Cancel transfer transactions
- `GET /api/transactions/transfers/:id` - Get a transfer transaction

#### Outgoing Wire Transfers
- `POST /api/transactions/outgoing-wire-transfers` - Create an outgoing wire transfer
- `GET /api/transactions/outgoing-wire-transfers` - Get all outgoing wire transfers
- `POST /api/transactions/outgoing-wire-transfers/bulk` - Create bulk outgoing wire transfers
- `POST /api/transactions/outgoing-wire-transfers/cancel` - Cancel outgoing wire transfers
- `GET /api/transactions/outgoing-wire-transfers/:id` - Get an outgoing wire transfer
- `POST /api/transactions/outgoing-wire-transfers/:id/cancel` - Cancel specific outgoing wire transfer
- `POST /api/transactions/outgoing-wire-transfers/:id/confirm` - Confirm outgoing wire transfer
- `POST /api/transactions/outgoing-wire-transfers/:id/sca/otp` - Issue OTP for wire transfer verification
- `POST /api/transactions/outgoing-wire-transfers/:id/sca/otp/verify` - Verify wire transfer with OTP
- `POST /api/transactions/outgoing-wire-transfers/:id/sca/push` - Issue push notification for wire transfer verification

### Bulk Operations
#### Operations
- `POST /api/bulk/users` - Create users in bulk
- `POST /api/bulk/users/invite` - Send user invites in bulk
- `POST /api/bulk/managed-cards/block` - Block cards in bulk
- `POST /api/bulk/managed-cards/unblock` - Unblock cards in bulk
- `POST /api/bulk/managed-cards/remove` - Remove cards in bulk
- `PATCH /api/bulk/managed-cards/spend-rules` - Update spend rules in bulk
- `POST /api/bulk/transfers` - Create transfer transactions in bulk
- `POST /api/bulk/sends` - Create send transactions in bulk
- `POST /api/bulk/outgoing-wire-transfers` - Create outgoing wire transfers in bulk

#### Management
- `GET /api/bulk` - Get all bulk processes
- `GET /api/bulk/:id` - Get bulk process details
- `GET /api/bulk/:id/operations` - Get all operations in a bulk process
- `POST /api/bulk/:id/execute` - Execute bulk process
- `POST /api/bulk/:id/pause` - Pause bulk process
- `POST /api/bulk/:id/resume` - Resume bulk process
- `POST /api/bulk/:id/cancel` - Cancel bulk process

## Authentication

All API requests require:
- `x-api-key` or `api_key` header with your Weavr API key
- `authorization` or `auth_token` header with the user's auth token (for authenticated endpoints)

## Deployment

This API is configured to run under `https://api.vaelixbank.com/`. Make sure to:

1. Set up a reverse proxy (nginx) to forward requests to the API
2. Configure SSL certificates for HTTPS
3. Set environment variables appropriately
4. Use a process manager like PM2 in production

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `WEAVR_API_BASE_URL` - Weavr API base URL (default: https://api.weavr.io)

## License

ISC
