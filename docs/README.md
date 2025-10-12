# Vaelix Bank API Documentation

## Overview

The Vaelix Bank API is a comprehensive banking and financial services API built with Node.js and TypeScript using the Express framework. It provides endpoints for user management, account operations, card management, transactions, and integrations with external services like Weavr.

## Architecture

The application follows a modular architecture with the following main components:

- **Controllers**: Handle business logic and API responses
- **Models**: Define data structures and database schemas
- **Routes**: Define API endpoints and route handlers
- **Services**: Contain logic for external integrations and complex operations
- **Middleware**: Handle authentication, authorization, and request processing
- **Queries**: Database query functions
- **Utils**: Utility functions for logging, database connections, validation, etc.

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

The API provides endpoints for:

- Authentication (`/api/auth`)
- Password management (`/api/passwords`)
- Strong Customer Authentication (`/api/sca`)
- Corporate and consumer user management (`/api/corporates`, `/api/consumers`)
- User profiles (`/api/users`)
- Beneficiaries (`/api/beneficiaries`)
- Accounts (`/api/accounts`)
- Cards (`/api/cards`)
- Linked accounts (`/api/linked-accounts`)
- Transactions (`/api/transactions`)
- Bulk operations (`/api/bulk`)
- API keys (`/api/keys`)
- Mobile authentication (`/api/auth/mobile`)

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

- **Weavr**: Payment and card services integration
- Database: PostgreSQL for data persistence

## Development

The application uses TypeScript for type safety and includes Jest for testing. Package management is handled with pnpm.

For detailed API specifications, see the [API Documentation](./API.md).

For model definitions, see the [Models Documentation](./Models.md).

For mobile application integration, see the [Mobile Integration Guide](./MOBILE_INTEGRATION.md).