# Multi-Database Support

This document describes the multi-database system implemented in the Vaelix Bank API, enabling interconnection and communication between multiple PostgreSQL servers via dedicated API keys.

## Architecture

### Main Components

1. **DatabaseManager** (`app/services/databaseManager.ts`)
   - Centralized management of connections to multiple databases
   - Automatic routing based on API keys
   - Database health monitoring
   - Support for federated queries

2. **ReplicationService** (`app/services/replicationService.ts`)
   - Automatic synchronization between databases
   - Configurable replication jobs
   - On-demand manual replication

3. **DatabaseController** (`app/controllers/DatabaseController.ts`)
   - Endpoints for multi-database operations
   - Federated query management
   - Replication job control

4. **Routing Middleware** (`app/middleware/apiKeyAuth.ts`)
   - Automatic routing to the correct database based on API key
   - Database health validation

## Configuration

### Environment Variables

```bash
# Primary database (required)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaelixbank
DB_USER=postgres
DB_PASSWORD=password

# Secondary database (optional)
DB2_HOST=secondary-db.example.com
DB2_PORT=5432
DB2_NAME=vaelixbank_secondary
DB2_USER=postgres
DB2_PASSWORD=password

# Analytics database (optional)
DB3_HOST=analytics-db.example.com
DB3_PORT=5432
DB3_NAME=vaelixbank_analytics
DB3_USER=postgres
DB3_PASSWORD=password
```

### Database Configuration

Database configuration is done automatically in `app/config/index.ts`:

```typescript
databases: [
  {
    id: 'primary',
    name: 'Primary Database',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    maxConnections: 20,
    region: 'eu-west',
    readOnly: false,
  },
  // ... other databases
]
```

## Usage

### Authentication

All multi-database operations require a `database` type API key:

```bash
curl -X POST /api/database/query \
  -H "X-API-Key: vb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "X-API-Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users LIMIT 10"}'
```

### Available Endpoints

#### Query Execution

```http
POST /api/database/query
```

Executes a query on the automatically routed database.

**Example:**
```json
{
  "query": "SELECT id, name FROM accounts WHERE balance > 1000",
  "params": []
}
```

#### Multi-Query Transactions

```http
POST /api/database/transaction
```

Executes multiple queries in a transaction.

**Example:**
```json
{
  "queries": [
    {
      "query": "UPDATE accounts SET balance = balance - 100 WHERE id = $1",
      "params": [123]
    },
    {
      "query": "UPDATE accounts SET balance = balance + 100 WHERE id = $1",
      "params": [456]
    }
  ]
}
```

#### Federated Queries

```http
POST /api/database/federated-query
```

Executes a query on multiple databases simultaneously.

**Example:**
```json
{
  "query": "SELECT COUNT(*) as user_count FROM users",
  "databases": ["primary", "secondary"]
}
```

#### Database Information

```http
GET /api/database/info
```

Returns information about the current database and all available databases.

#### Database Schema

```http
GET /api/database/schema
```

Returns the table structure of the routed database.

#### Health Check

```http
GET /api/database/health
```

Checks the health of the routed database.

### Replication Management

#### List Replication Jobs

```http
GET /api/database/replication/jobs
```

#### Create Replication Job

```http
POST /api/database/replication/jobs
```

**Example:**
```json
{
  "sourceDatabase": "primary",
  "targetDatabases": ["secondary", "analytics"],
  "tables": ["users", "transactions"],
  "syncKey": "updated_at",
  "intervalMinutes": 15,
  "enabled": true
}
```

#### Run Manual Replication

```http
POST /api/database/replication/jobs/{jobId}/run
```

#### Replicate Table Immediately

```http
POST /api/database/replication/table
```

**Example:**
```json
{
  "sourceDatabase": "primary",
  "targetDatabases": ["secondary"],
  "table": "transactions",
  "syncKey": "created_at"
}
```

## Automatic Routing

The system automatically routes requests to the correct database based on the API key type:

- **Database keys**: Routing based on user ID (simple sharding)
- **Client keys**: Always to the primary database
- **Server keys**: Access to all databases based on context

### Sharding Logic

By default, simple sharding based on user ID parity:

```typescript
private routeByUserId(userId: number): string {
  if (userId % 2 === 0) {
    return 'primary';
  } else if (this.pools.has('secondary')) {
    return 'secondary';
  } else {
    return 'primary';
  }
}
```

## Monitoring and Health

### Automatic Health Checks

The system performs health checks every 30 seconds:

- Active connections
- Response time
- Connection pool status

### Available Metrics

```json
{
  "currentDatabase": {
    "id": "primary",
    "name": "Primary Database",
    "health": {
      "status": "healthy",
      "lastChecked": "2025-10-17T...",
      "connectionCount": 5,
      "responseTime": 12
    }
  }
}
```

## Security

### Mandatory Authentication

All multi-database operations require:
- Valid `database` type API key
- Corresponding API secret
- Healthy database

### Data Isolation

- Each API key can only access a specific database
- Federated queries are controlled
- Complete audit trail of operations

## Performance

### Optimizations

- Configurable connection pools
- Parallel queries for federated operations
- Health metadata caching
- Optimized transactions

### Limitations

- No support for native cross-database JOIN queries
- Network latency for federated operations
- Eventual consistency for replication

## Deployment

### Prerequisites

1. Multiple PostgreSQL instances configured
2. Network allowing connectivity between servers
3. `database` type API keys created

### Startup

The system initializes automatically when the API starts:

1. Connections to configured databases
2. Health check startup
3. Default replication job initialization

### Monitoring

Monitor logs for:
- Database connection failures
- Replication errors
- Federated query performance

## Usage Examples

### Data Migration

```bash
# Replicate a table to multiple databases
curl -X POST /api/database/replication/table \
  -H "X-API-Key: ..." \
  -H "X-API-Secret: ..." \
  -d '{
    "sourceDatabase": "primary",
    "targetDatabases": ["secondary", "analytics"],
    "table": "transactions",
    "syncKey": "created_at"
  }'
```

### Federated Analytics Query

```bash
# Count users across all databases
curl -X POST /api/database/federated-query \
  -H "X-API-Key: ..." \
  -H "X-API-Secret: ..." \
  -d '{
    "query": "SELECT COUNT(*) as total_users FROM users"
  }'
```

### Global Health Check

```bash
# Check status of all databases
curl -X GET /api/database/info \
  -H "X-API-Key: ..." \
  -H "X-API-Secret: ..."
```