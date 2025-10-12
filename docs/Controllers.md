# Vaelix Bank API Controllers

Controllers handle the business logic for API endpoints. They process requests, interact with queries and services, and return responses.

## UserController

Handles user management operations.

**Methods:**
- `getAllUsers()` - Retrieve all users
- `getUserById(id)` - Get user by ID
- `createUser(data)` - Create new user
- `updateUser(id, data)` - Update user information
- `deleteUser(id)` - Delete user

## AccountController

Manages bank account operations.

**Methods:**
- `getAllAccounts()` - Get all accounts (not implemented)
- `getAccountById(id)` - Get account by ID
- `getAccountBalance(id)` - Get account balance
- `getAccountsByUserId(userId)` - Get user's accounts
- `createAccount(data)` - Create new account
- `updateAccount(id, data)` - Update account details
- `updateAccountBalance(id, amount)` - Update account balance
- `closeAccount(id)` - Close account
- `getAccountTransactions(id, limit, offset)` - Get account transactions

## AuthController

Handles authentication and authorization.

**Methods:**
- `login(credentials)` - Standard login
- `loginBiometric(credentials)` - Biometric authentication
- `getUserIdentities()` - Get user identities
- `logout()` - User logout
- `requestAccessToken()` - Request access token

## CardController

Manages payment cards.

**Methods:**
- Card creation, retrieval, updates
- Spend rule management
- Physical card operations
- Card statements and transactions

## LedgerController

Handles ledger and financial reporting.

**Methods:**
- Ledger snapshots
- Financial reports
- Transaction auditing

## ApiKeyController

Manages API keys for authentication.

**Methods:**
- API key creation and management
- Key validation and revocation

## MobileAuthController

Handles mobile application authentication.

**Methods:**
- Mobile login and registration
- Device management
- Session handling

## WeavrAccountController

Integrates with Weavr for account management.

**Methods:**
- Managed account operations
- Account statements
- IBAN management

## Other Controllers

- **BulkController**: Bulk operations
- **TransactionController**: Transaction management
- **BeneficiaryController**: Beneficiary management
- **LinkedAccountController**: Linked account operations

## Controller Patterns

All controllers follow similar patterns:

1. **Error Handling**: Try-catch blocks with appropriate HTTP status codes
2. **Validation**: Input validation and sanitization
3. **Database Interaction**: Use query modules for database operations
4. **Response Formatting**: Consistent JSON response structure
5. **Logging**: Request/response logging for debugging
6. **Authentication**: Integration with auth middleware where required

## Dependencies

Controllers depend on:
- **Queries**: Database query functions
- **Services**: External API integrations (Weavr, etc.)
- **Utils**: Helper functions for validation, response handling, logging
- **Models**: TypeScript interfaces for type safety