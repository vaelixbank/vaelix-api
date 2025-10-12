# Vaelix Bank API Services & Middleware

## Services

### WeavrService

Handles integration with the Weavr payment platform.

**Features:**
- Axios-based HTTP client for Weavr API
- Automatic header management (API keys, auth tokens)
- Error handling and response parsing
- Timeout configuration (30 seconds)

**Methods:**
- `makeRequest(method, url, data?, apiKey?, authToken?)` - Generic API request method

### WeavrSyncService

Manages synchronization between local database and Weavr platform.

**Features:**
- Event-driven synchronization
- Webhook processing
- Data consistency checks
- Error recovery and retry logic

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

### Service Layer
- Separation of concerns between controllers and external services
- Dependency injection for testability
- Error handling and retry logic

### Middleware Chain
- Request preprocessing (auth, validation, logging)
- Response postprocessing (formatting, headers)
- Error interception and handling

### Utility Functions
- Reusable helper functions
- Configuration management
- Type safety with TypeScript interfaces