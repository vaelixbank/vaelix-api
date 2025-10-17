# 🗄️ Vaelix Bank API - Database Setup Guide

This guide explains how to configure and inject the database schema for the Vaelix Bank API.

## 📋 Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 16+ installed
- Access to a PostgreSQL database

## ⚙️ Environment Variables Configuration

1. **Copy the environment example file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure database variables in `.env`:**
   ```env
   # Database Configuration
   DB_HOST=localhost          # PostgreSQL server address
   DB_PORT=5432              # PostgreSQL port (default: 5432)
   DB_NAME=vaelixbank        # Database name
   DB_USER=vaelixbank_user   # PostgreSQL user
   DB_PASSWORD=your_password # Secure password
   ```

3. **Optional variables:**
   ```env
   NODE_ENV=development      # Environment (development/production)
   ```

## 🚀 Database Schema Injection

### Method 1: Using the Automatic Script (Recommended)

The automatic script handles connection, validation, and schema injection:

```bash
# Complete schema injection
npm run db:schema

# Or directly with Node.js
node scripts/inject-schema.js
```

**What the script does:**
- ✅ Validates environment variables
- ✅ Tests database connection
- ✅ Reads and parses the `data/schema-pgsql.sql` file
- ✅ Executes all SQL statements
- ✅ Handles errors and continues execution
- ✅ Displays detailed operation report

### Method 2: Manual Injection with psql

If you prefer a manual approach:

```bash
# Via psql directly
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f data/schema-pgsql.sql

# Or via Docker if using PostgreSQL in container
docker exec -i vaelixbank-postgres psql -U $DB_USER -d $DB_NAME < data/schema-pgsql.sql
```

## 📊 Schema Content

The schema includes **73 tables** organized in sections:

### 🏦 **Core Banking (Base Tables)**
- `users` - Users and authentication
- `accounts` - Bank accounts
- `transactions` - Financial transactions
- `cards` - Payment cards
- `wallets` - Electronic wallets

### 🔓 **Open Banking (Berlin Group API)**
- `open_banking_consents` - Open Banking consents
- `payment_initiations` - Payment initiations
- `webhook_subscriptions` - Webhook subscriptions
- `webhook_events_open_banking` - Open Banking events

### 🏢 **BaaS (Banking as a Service)**
- `baas_customers` - BaaS customers
- `baas_accounts` - BaaS accounts
- `baas_cards` - BaaS cards
- `baas_transactions` - BaaS transactions

### ⚖️ **Legal Compliance (KYC, AML, GDPR)**
- `kyc_profiles` - Advanced KYC profiles
- `aml_screening_results` - AML screening results
- `regulatory_reports` - Regulatory reports
- `compliance_incidents` - Compliance incidents
- `consent_records` - GDPR consent management
- `risk_assessments` - Risk assessments
- `audit_trail` - Complete traceability
- `security_events` - Security events

### 🔗 **Weavr Integration**
- Weavr fields in all relevant tables
- `weavr_sync` - Bidirectional synchronization
- KYC references and Weavr verifications

## 🔍 Schema Validation

After injection, you can validate that everything is correct:

```bash
# Schema syntax validation
npm run db:validate

# Or manually check the number of tables
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## 🛠️ Troubleshooting

### Connection Error
```
❌ Missing required environment variables
```
**Solution:** Verify that all `DB_*` variables are defined in `.env`

### Authentication Error
```
FATAL: password authentication failed
```
**Solution:** Check PostgreSQL credentials and user permissions

### Tables Already Exist
```
ERROR: relation "users" already exists
```
**Solution:** The script automatically handles these errors and continues. This is normal during re-executions.

### Permission Errors
```
ERROR: permission denied for database
```
**Solution:** Grant necessary permissions to the PostgreSQL user:
```sql
GRANT ALL PRIVILEGES ON DATABASE vaelixbank TO vaelixbank_user;
```

## 📈 Performance and Indexing

The schema includes **80+ indexes** optimized for:
- ✅ Frequent queries (search by ID, status, dates)
- ✅ Complex joins (entity relationships)
- ✅ Regulatory filtering (KYC, AML, audit)
- ✅ Temporal search (transactions, events)

## 🔐 Security

- ✅ **Password encryption** and sensitive data
- ✅ **Validation constraints** on all critical data
- ✅ **Complete audit trails** for compliance
- ✅ **Granular permission management**

## 🚀 Next Steps

After schema injection:

1. **Start the API:**
   ```bash
   npm start
   ```

2. **Create an administrator user:**
   ```bash
   # Use authentication endpoints
   ```

3. **Configure Weavr:**
   - Set `WEAVR_API_KEY` in `.env`
   - Test Weavr integration

4. **Configure monitoring:**
   - Logs, metrics, alerts

## 📞 Support

In case of issues:
1. Check the injection script logs
2. Review detailed PostgreSQL errors
3. Verify network configuration and firewalls

---

**🎉 Your Vaelix Bank database is now ready for production!**