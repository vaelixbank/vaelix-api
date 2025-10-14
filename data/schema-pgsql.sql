-- =========================================
-- PostgreSQL Schema Vaelix Bank API - 76 tables
-- =========================================
-- Complete database schema for Vaelix Bank API
-- Includes core banking, Open Banking (Berlin Group), BaaS, and Weavr integration
-- Full legal compliance for banking information management (KYC, AML, GDPR, Regulatory)
-- Ready for production deployment with comprehensive audit trails
-- =========================================

-- 1. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    kyc_status VARCHAR(50),
    password_hash VARCHAR(255),
    device_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 3. User Roles
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    role_id INT REFERENCES roles(id),
    assigned_at TIMESTAMP DEFAULT NOW()
);

-- 4. Accounts
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    account_number VARCHAR(50) UNIQUE,
    account_type VARCHAR(50),
    currency CHAR(3) DEFAULT 'EUR',
    balance NUMERIC(30, 2) DEFAULT 0,
    available_balance NUMERIC(30, 2) DEFAULT 0,
    blocked_balance NUMERIC(30, 2) DEFAULT 0,
    reserved_balance NUMERIC(30, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    -- Mirroring fields
    parent_master_account_id INT REFERENCES accounts(id),
    -- Weavr integration fields
    weavr_id VARCHAR(100) UNIQUE,
    weavr_profile_id VARCHAR(100),
    iban VARCHAR(34),
    bic VARCHAR(11),
    account_name VARCHAR(255),
    -- Sync fields
    last_weavr_sync TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4.5 Account Mirrors
CREATE TABLE account_mirrors (
    id SERIAL PRIMARY KEY,
    master_account_id INT REFERENCES accounts(id) NOT NULL,
    mirrored_account_id INT REFERENCES accounts(id) NOT NULL UNIQUE,
    sync_enabled BOOLEAN DEFAULT TRUE,
    mirror_type VARCHAR(20) DEFAULT 'full' CHECK (mirror_type IN ('full', 'partial')),
    proportion NUMERIC(5, 4) DEFAULT 1.0000 CHECK (proportion > 0 AND proportion <= 1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(master_account_id, mirrored_account_id)
);

-- 5. Wallets
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    account_id INT REFERENCES accounts(id),
    wallet_type VARCHAR(50),
    balance NUMERIC(30, 2) DEFAULT 0,
    currency CHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Vibans / Cards
CREATE TABLE vibans_cards (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    viban_id VARCHAR(100) UNIQUE,
    iban VARCHAR(50),
    currency CHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'active',
    -- Wallet preparation fields
    wallet_ready BOOLEAN DEFAULT FALSE,
    wallet_card_number VARCHAR(20),
    wallet_cvv VARCHAR(4),
    wallet_expiry_month VARCHAR(2),
    wallet_expiry_year VARCHAR(4),
    wallet_name_on_card VARCHAR(100),
    wallet_last_accessed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6.5 Card Provisioning
CREATE TABLE card_provisioning (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(100) NOT NULL,
    wallet_type VARCHAR(20) NOT NULL CHECK (wallet_type IN ('apple_pay', 'google_pay')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'revoked')),
    device_id VARCHAR(100),
    wallet_account_id VARCHAR(100),
    provisioned_at TIMESTAMP,
    last_attempt TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(card_id, wallet_type)
);

-- 7. Transactions
CREATE TABLE transactions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    account_id INT REFERENCES accounts(id),
    customer_id VARCHAR(36), -- For BaaS transactions
    merchant_id INT REFERENCES merchants(id), -- Reference to merchants table
    amount NUMERIC(30,2) NOT NULL,
    currency CHAR(3) DEFAULT 'EUR',
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    category VARCHAR(50),
    merchant_data JSONB, -- Additional merchant information
    reference VARCHAR(255), -- Transaction reference
    metadata JSONB, -- Additional transaction metadata
    processed_at TIMESTAMP, -- When transaction was processed
    weavr_transaction_id VARCHAR(100), -- Weavr integration
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Transaction Audit
CREATE TABLE transaction_audit (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(36) REFERENCES transactions(id),
    action VARCHAR(50),
    performed_by INT REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 9. Transaction Limits
CREATE TABLE transaction_limits (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id),
    daily_limit NUMERIC(30,2) DEFAULT 10000,
    monthly_limit NUMERIC(30,2) DEFAULT 50000
);

-- 10. FX Rates
CREATE TABLE fx_rates (
    id SERIAL PRIMARY KEY,
    from_currency CHAR(3),
    to_currency CHAR(3),
    rate NUMERIC(18,6),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 12. API Keys
CREATE TABLE api_keys (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    key VARCHAR(255) UNIQUE,
    secret VARCHAR(255),
    type VARCHAR(20) CHECK (type IN ('client', 'server', 'database')),
    description TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Approvals
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(36) REFERENCES transactions(id),
    approver_id INT REFERENCES users(id),
    approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP
);

-- 14. Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    action VARCHAR(100),
    object_type VARCHAR(50),
    object_id INT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- 15. Audit Policies
CREATE TABLE audit_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Board Members
CREATE TABLE board_members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255),
    position VARCHAR(100),
    joined_at DATE,
    status VARCHAR(50) DEFAULT 'active'
);

-- 17. Card Transactions
CREATE TABLE card_transactions (
    id SERIAL PRIMARY KEY,
    card_id INT REFERENCES vibans_cards(id),
    amount NUMERIC(30,2),
    currency CHAR(3) DEFAULT 'EUR',
    merchant VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 18. Fraud Detection
CREATE TABLE fraud_detection (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(36) REFERENCES transactions(id),
    risk_level VARCHAR(50),
    flagged_at TIMESTAMP DEFAULT NOW()
);

-- 19. Insurance Contracts
CREATE TABLE insurance_contracts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    policy_number VARCHAR(100) UNIQUE,
    coverage_amount NUMERIC(30,2),
    status VARCHAR(20),
    start_date DATE,
    end_date DATE
);

-- 20. Interbank Transfers
CREATE TABLE interbank_transfers (
    id SERIAL PRIMARY KEY,
    from_account INT REFERENCES accounts(id),
    to_account_number VARCHAR(50),
    amount NUMERIC(30,2),
    currency CHAR(3),
    status VARCHAR(20) DEFAULT 'pending',
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 21. Investments
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    type VARCHAR(50),
    amount NUMERIC(30,2),
    currency CHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 22. KYC Documents
CREATE TABLE kyc_documents (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    document_type VARCHAR(50),
    document_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 23. Ledger Snapshots
CREATE TABLE ledger_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date TIMESTAMP DEFAULT NOW(),
    total_balance NUMERIC(30,2)
);

-- 24. Loans
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    principal NUMERIC(30,2),
    interest_rate NUMERIC(5,2),
    term_months INT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 25. Login Attempts
CREATE TABLE login_attempts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    ip_address VARCHAR(50),
    success BOOLEAN,
    attempted_at TIMESTAMP DEFAULT NOW()
);

-- 26. Merchant Profiles
CREATE TABLE merchant_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    merchant_id VARCHAR(50) UNIQUE,
    country CHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 27. OpenPayd Mappings
CREATE TABLE openpayd_mappings (
    id SERIAL PRIMARY KEY,
    viban_id VARCHAR(100),
    openpayd_account_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 28. Partner Banks
CREATE TABLE partner_banks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    swift_code VARCHAR(20),
    country CHAR(2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 29. Partner Integrations
CREATE TABLE partner_integrations (
    id SERIAL PRIMARY KEY,
    partner_bank_id INT REFERENCES partner_banks(id),
    integration_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 30. Payment Requests
CREATE TABLE payment_requests (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id),
    amount NUMERIC(30,2),
    currency CHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 31. Protocol Versions
CREATE TABLE protocol_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20),
    description TEXT,
    released_at TIMESTAMP
);

-- 32. Regulatory Reports
CREATE TABLE regulatory_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(50),
    content TEXT,
    generated_at TIMESTAMP DEFAULT NOW()
);

-- 33. Savings
CREATE TABLE savings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    balance NUMERIC(30,2),
    interest_rate NUMERIC(5,2),
    currency CHAR(3) DEFAULT 'EUR',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 34. Security Incidents
CREATE TABLE security_incidents (
    id SERIAL PRIMARY KEY,
    incident_type VARCHAR(50),
    description TEXT,
    detected_at TIMESTAMP DEFAULT NOW()
);

-- 35. Sessions
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id INT REFERENCES users(id),
    session_token VARCHAR(255),
    device_id VARCHAR(255), -- For mobile auth
    access_token VARCHAR(500), -- JWT access token
    refresh_token VARCHAR(500), -- JWT refresh token
    expires_at TIMESTAMP, -- Access token expiry
    refresh_expires_at TIMESTAMP, -- Refresh token expiry
    is_active BOOLEAN DEFAULT TRUE, -- Session active status
    last_activity TIMESTAMP DEFAULT NOW(), -- Last activity timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- 36. Support Tickets
CREATE TABLE support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 37. VBG Nodes
CREATE TABLE vbg_nodes (
    id SERIAL PRIMARY KEY,
    node_name VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 38. Accounts Wealth Portfolios
CREATE TABLE wealth_portfolios (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    portfolio_name VARCHAR(100),
    total_value NUMERIC(30,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 39. AML Flags
CREATE TABLE aml_flags (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    transaction_id VARCHAR(36) REFERENCES transactions(id),
    reason VARCHAR(255),
    flagged_at TIMESTAMP DEFAULT NOW()
);

-- 40. Beneficiaries
CREATE TABLE beneficiaries (
    id VARCHAR(100) PRIMARY KEY,
    profile_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('individual', 'corporate')),
    state VARCHAR(20) DEFAULT 'active' CHECK (state IN ('active', 'inactive')),
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 41. Beneficiary Batches
CREATE TABLE beneficiary_batches (
    id VARCHAR(100) PRIMARY KEY,
    profile_id VARCHAR(100),
    state VARCHAR(20) DEFAULT 'pending' CHECK (state IN ('pending', 'approved', 'rejected')),
    beneficiaries JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 42. Bulk Processes
CREATE TABLE bulk_processes (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(50),
    state VARCHAR(20) DEFAULT 'pending' CHECK (state IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    progress JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- 43. Bulk Operations
CREATE TABLE bulk_operations (
    id VARCHAR(100) PRIMARY KEY,
    bulk_id VARCHAR(100) REFERENCES bulk_processes(id),
    type VARCHAR(50),
    state VARCHAR(20) DEFAULT 'pending' CHECK (state IN ('pending', 'running', 'completed', 'failed')),
    data JSONB,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 46. Linked Accounts
CREATE TABLE linked_accounts (
    id VARCHAR(100) PRIMARY KEY,
    profile_id VARCHAR(100),
    name VARCHAR(255),
    state VARCHAR(20) DEFAULT 'active' CHECK (state IN ('active', 'blocked', 'closed')),
    type VARCHAR(20) CHECK (type IN ('checking', 'savings', 'business')),
    currency CHAR(3),
    balance JSONB,
    bank_details JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 47. Account Identifiers
CREATE TABLE account_identifiers (
    id SERIAL PRIMARY KEY,
    linked_account_id VARCHAR(100) REFERENCES linked_accounts(id),
    type VARCHAR(20) CHECK (type IN ('iban', 'bban', 'account_number', 'sort_code')),
    identification VARCHAR(100)
);

-- 48. Auth Factors
CREATE TABLE auth_factors (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('otp', 'push')),
    state VARCHAR(20) DEFAULT 'active' CHECK (state IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);

-- 49. SCA Challenges
CREATE TABLE sca_challenges (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('step_up', 'confirmation')),
    method VARCHAR(20) CHECK (method IN ('otp', 'push')),
    state VARCHAR(20) DEFAULT 'pending' CHECK (state IN ('pending', 'completed', 'expired', 'failed')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- 50. Client Profiles (Consumers)
CREATE TABLE consumers (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT REFERENCES users(id),
    weavr_id VARCHAR(100) UNIQUE,
    type VARCHAR(20) DEFAULT 'consumer',
    state VARCHAR(50) DEFAULT 'active',
    root_user JSONB,
    kyc JSONB,
    tag VARCHAR(255),
    -- Sync fields
    last_weavr_sync TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 51. Corporate Profiles
CREATE TABLE corporates (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT REFERENCES users(id),
    weavr_id VARCHAR(100) UNIQUE,
    type VARCHAR(20) DEFAULT 'corporate',
    state VARCHAR(50) DEFAULT 'active',
    root_user JSONB,
    kyb JSONB,
    company JSONB,
    tag VARCHAR(255),
    -- Sync fields
    last_weavr_sync TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 52. Balance History
CREATE TABLE balance_history (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id),
    previous_balance NUMERIC(30,2),
    new_balance NUMERIC(30,2),
    available_previous NUMERIC(30,2),
    available_new NUMERIC(30,2),
    blocked_previous NUMERIC(30,2),
    blocked_new NUMERIC(30,2),
    change_amount NUMERIC(30,2),
    change_type VARCHAR(50), -- 'credit', 'debit', 'block', 'unblock', 'reserve', 'release'
    transaction_id VARCHAR(36) REFERENCES transactions(id),
    weavr_transaction_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 53. Weavr Sync Tracking
CREATE TABLE weavr_sync (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50), -- 'account', 'card', 'consumer', 'corporate', 'transaction'
    entity_id VARCHAR(100), -- ID local (peut être INT ou VARCHAR selon l'entité)
    weavr_id VARCHAR(100), -- ID Weavr
    weavr_profile_id VARCHAR(100), -- Profile ID Weavr si applicable
    sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'syncing'
    sync_direction VARCHAR(20), -- 'to_weavr', 'from_weavr', 'bidirectional'
    last_sync_attempt TIMESTAMP,
    last_sync_success TIMESTAMP,
    retry_count INT DEFAULT 0,
    sync_errors JSONB,
    webhook_data JSONB, -- Données reçues via webhook
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 54. Webhook Events
CREATE TABLE webhook_events (
    id SERIAL PRIMARY KEY,
    weavr_event_id VARCHAR(100) UNIQUE,
    event_type VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    raw_payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    processing_attempts INT DEFAULT 0,
    last_attempt TIMESTAMP,
    processing_errors JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- =========================================
-- Open Banking Tables (Berlin Group API)
-- =========================================

-- 55. Open Banking Consents
CREATE TABLE open_banking_consents (
    id SERIAL PRIMARY KEY,
    consent_id VARCHAR(36) UNIQUE NOT NULL,
    consent_status VARCHAR(50) NOT NULL CHECK (consent_status IN ('received', 'rejected', 'valid', 'revokedByPsu', 'expired', 'terminatedByTpp')),
    consent_type VARCHAR(20) NOT NULL CHECK (consent_type IN ('ais', 'pis', 'piis')),
    frequency_per_day INT CHECK (frequency_per_day > 0),
    recurring_indicator BOOLEAN DEFAULT FALSE,
    valid_until TIMESTAMP NOT NULL,
    last_action_date TIMESTAMP DEFAULT NOW(),
    psu_id VARCHAR(36),
    tpp_id VARCHAR(36) NOT NULL,
    accounts JSONB,
    balances JSONB,
    transactions JSONB,
    payments JSONB,
    funds_confirmations JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 56. Payment Initiations
CREATE TABLE payment_initiations (
    id SERIAL PRIMARY KEY,
    payment_id VARCHAR(36) UNIQUE NOT NULL,
    payment_product VARCHAR(50) NOT NULL,
    payment_data JSONB NOT NULL,
    tpp_id VARCHAR(36) NOT NULL,
    psu_id VARCHAR(36),
    status VARCHAR(20) DEFAULT 'PDNG' CHECK (status IN ('PDNG', 'ACCP', 'ACSC', 'ACSP', 'ACTC', 'ACWC', 'ACWP', 'RJCT', 'CANC', 'ACFC', 'PART')),
    funds_available BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 57. Webhook Subscriptions
CREATE TABLE webhook_subscriptions (
    id SERIAL PRIMARY KEY,
    subscription_id VARCHAR(36) UNIQUE NOT NULL,
    tpp_id VARCHAR(36) NOT NULL,
    webhook_url VARCHAR(500) NOT NULL,
    events JSONB NOT NULL,
    secret VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 58. Webhook Events
CREATE TABLE webhook_events_open_banking (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(36) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    tpp_id VARCHAR(36),
    psu_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 59. Webhook Deliveries
CREATE TABLE webhook_deliveries (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    subscription_id VARCHAR(36) NOT NULL,
    success BOOLEAN NOT NULL,
    status_code INT,
    delivered_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- BaaS (Banking as a Service) Tables
-- =========================================

-- 60. BaaS Customers
CREATE TABLE baas_customers (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(36) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('retail', 'business')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    profile JSONB NOT NULL,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'expired')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 61. BaaS Accounts
CREATE TABLE baas_accounts (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(36) UNIQUE NOT NULL,
    customer_id VARCHAR(36) NOT NULL REFERENCES baas_customers(customer_id),
    type VARCHAR(20) DEFAULT 'checking' CHECK (type IN ('checking', 'savings', 'business')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    currency VARCHAR(3) DEFAULT 'EUR',
    balance_current JSONB DEFAULT '0',
    balance_available JSONB DEFAULT '0',
    limits JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    iban VARCHAR(34),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 62. BaaS Cards
CREATE TABLE baas_cards (
    id SERIAL PRIMARY KEY,
    card_id VARCHAR(36) UNIQUE NOT NULL,
    account_id VARCHAR(36) NOT NULL REFERENCES baas_accounts(account_id),
    customer_id VARCHAR(36) NOT NULL REFERENCES baas_customers(customer_id),
    type VARCHAR(20) DEFAULT 'debit' CHECK (type IN ('debit', 'credit', 'prepaid')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'blocked', 'closed')),
    masked_pan VARCHAR(20) NOT NULL,
    expiry_date VARCHAR(7) NOT NULL,
    cardholder_name VARCHAR(100) NOT NULL,
    limits JSONB DEFAULT '{}',
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 63. BaaS Transactions
CREATE TABLE baas_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(36) UNIQUE NOT NULL,
    account_id VARCHAR(36) NOT NULL REFERENCES baas_accounts(account_id),
    customer_id VARCHAR(36) NOT NULL REFERENCES baas_customers(customer_id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount NUMERIC(30,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    category VARCHAR(50),
    merchant JSONB,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Legal Compliance & Regulatory Tables (Weavr Integration)
-- =========================================

-- 64. Enhanced KYC Profiles
CREATE TABLE kyc_profiles (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    customer_id VARCHAR(36), -- Pour BaaS customers
    weavr_customer_id VARCHAR(100), -- ID Weavr
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected', 'expired', 'requires_update')),
    risk_level VARCHAR(20) DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    -- Personal Information
    full_name VARCHAR(255),
    date_of_birth DATE,
    nationality VARCHAR(3), -- ISO 3166-1 alpha-3
    country_of_residence VARCHAR(3), -- ISO 3166-1 alpha-3
    tax_residency VARCHAR(3), -- ISO 3166-1 alpha-3
    -- Identification Documents
    document_type VARCHAR(50) CHECK (document_type IN ('passport', 'national_id', 'drivers_license', 'residence_permit')),
    document_number VARCHAR(100),
    document_issuing_country VARCHAR(3),
    document_expiry_date DATE,
    document_verified BOOLEAN DEFAULT FALSE,
    -- Address Information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3),
    address_verified BOOLEAN DEFAULT FALSE,
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(50),
    phone_verified BOOLEAN DEFAULT FALSE,
    -- Employment Information
    employment_status VARCHAR(50) CHECK (employment_status IN ('employed', 'self_employed', 'unemployed', 'student', 'retired', 'other')),
    employer_name VARCHAR(255),
    job_title VARCHAR(100),
    annual_income_range VARCHAR(50),
    -- Source of Funds
    source_of_funds JSONB, -- Array of sources
    source_of_funds_verified BOOLEAN DEFAULT FALSE,
    -- Additional Compliance Data
    pep_status BOOLEAN DEFAULT FALSE, -- Politically Exposed Person
    pep_details JSONB,
    sanctions_screening_status VARCHAR(20) DEFAULT 'pending' CHECK (sanctions_screening_status IN ('pending', 'cleared', 'flagged', 'requires_review')),
    sanctions_details JSONB,
    adverse_media_check BOOLEAN DEFAULT FALSE,
    -- Weavr Specific Fields
    weavr_kyc_reference VARCHAR(100),
    weavr_verification_status VARCHAR(50),
    -- Audit Fields
    created_by INT REFERENCES users(id),
    reviewed_by INT REFERENCES users(id),
    last_reviewed_at TIMESTAMP,
    expires_at DATE CHECK (expires_at > CURRENT_DATE), -- KYC refresh requirement
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 65. AML Screening Results
CREATE TABLE aml_screening_results (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) CHECK (entity_type IN ('user', 'customer', 'beneficiary', 'transaction')),
    entity_id VARCHAR(100), -- Can reference users, customers, etc.
    screening_type VARCHAR(50) CHECK (screening_type IN ('sanctions', 'pep', 'adverse_media', 'watchlist', 'transaction_monitoring')),
    screening_provider VARCHAR(100), -- e.g., 'weavr', 'dow_jones', 'refinitiv', etc.
    screening_reference VARCHAR(100), -- Provider's reference ID
    risk_score NUMERIC(5,2), -- 0.00 to 100.00
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'flagged', 'escalated', 'false_positive')),
    -- Screening Results
    matches_found BOOLEAN DEFAULT FALSE,
    match_details JSONB, -- Detailed match information
    false_positive BOOLEAN DEFAULT FALSE,
    reviewed_by INT REFERENCES users(id),
    review_notes TEXT,
    -- Regulatory Reporting
    reportable BOOLEAN DEFAULT FALSE,
    reported_to_authorities BOOLEAN DEFAULT FALSE,
    report_reference VARCHAR(100),
    -- Audit Fields
    screened_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP, -- When re-screening is required
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 66. Regulatory Reports
CREATE TABLE regulatory_reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL, -- e.g., 'STR', 'CTR', 'GOAML', 'FATCA', 'CRS'
    report_subtype VARCHAR(50),
    reporting_entity VARCHAR(100), -- Bank identifier
    reference_number VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected', 'amended')),
    -- Report Content
    report_data JSONB NOT NULL,
    attachments JSONB, -- File references
    -- Involved Entities
    primary_entity_type VARCHAR(20),
    primary_entity_id VARCHAR(100),
    related_entities JSONB, -- Array of related entity IDs
    -- Regulatory Authority
    authority_name VARCHAR(100),
    authority_code VARCHAR(50),
    jurisdiction VARCHAR(3), -- ISO country code
    -- Submission Details
    submitted_by INT REFERENCES users(id),
    submitted_at TIMESTAMP,
    submission_reference VARCHAR(100), -- Authority's reference
    response_received_at TIMESTAMP,
    response_details JSONB,
    -- Audit Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 67. Compliance Incidents
CREATE TABLE compliance_incidents (
    id SERIAL PRIMARY KEY,
    incident_type VARCHAR(50) CHECK (incident_type IN ('aml_sar', 'fraud', 'data_breach', 'regulatory_breach', 'operational_error', 'other')),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed', 'escalated')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    -- Incident Details
    occurred_at TIMESTAMP NOT NULL,
    discovered_at TIMESTAMP DEFAULT NOW(),
    reported_at TIMESTAMP,
    -- Involved Entities
    affected_entity_type VARCHAR(20),
    affected_entity_id VARCHAR(100),
    involved_users JSONB, -- Array of user IDs
    -- Investigation
    assigned_to INT REFERENCES users(id),
    investigation_started_at TIMESTAMP,
    investigation_completed_at TIMESTAMP,
    investigation_findings TEXT,
    -- Resolution
    resolution TEXT,
    preventive_actions TEXT,
    lessons_learned TEXT,
    -- Regulatory Reporting
    reportable BOOLEAN DEFAULT FALSE,
    reported_to_authorities BOOLEAN DEFAULT FALSE,
    regulatory_reference VARCHAR(100),
    -- Audit Fields
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 68. Data Retention Policies
CREATE TABLE data_retention_policies (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL, -- e.g., 'transaction', 'kyc', 'audit_log', 'communication'
    retention_period_months INT NOT NULL,
    retention_reason VARCHAR(255),
    legal_basis VARCHAR(255), -- GDPR Article, Regulation reference
    jurisdiction VARCHAR(3), -- ISO country code
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 69. Data Retention Records
CREATE TABLE data_retention_records (
    id SERIAL PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(20),
    entity_id VARCHAR(100),
    retention_policy_id INT REFERENCES data_retention_policies(id),
    retention_start_date DATE NOT NULL,
    retention_end_date DATE NOT NULL CHECK (retention_end_date > retention_start_date),
    disposal_method VARCHAR(50) CHECK (disposal_method IN ('delete', 'archive', 'anonymize', 'encrypt')),
    disposal_status VARCHAR(20) DEFAULT 'active' CHECK (disposal_status IN ('active', 'scheduled', 'disposed', 'exempted')),
    disposal_date DATE,
    disposal_reference VARCHAR(100),
    exemption_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 70. Consent Management (GDPR)
CREATE TABLE consent_records (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    customer_id VARCHAR(36), -- Pour BaaS customers
    consent_type VARCHAR(50) NOT NULL, -- e.g., 'marketing', 'data_processing', 'cookies', 'open_banking'
    consent_version VARCHAR(20) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    expires_at DATE,
    ip_address INET,
    user_agent TEXT,
    consent_details JSONB, -- Additional context
    legal_basis VARCHAR(100), -- GDPR legal basis
    withdrawal_method VARCHAR(50), -- How consent can be withdrawn
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 71. Risk Assessments
CREATE TABLE risk_assessments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(20) CHECK (entity_type IN ('user', 'customer', 'account', 'transaction')),
    entity_id VARCHAR(100),
    assessment_type VARCHAR(50) CHECK (assessment_type IN ('customer_due_diligence', 'enhanced_due_diligence', 'transaction_risk', 'ongoing_monitoring')),
    risk_score NUMERIC(5,2), -- 0.00 to 100.00
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'very_high')),
    risk_factors JSONB, -- Array of risk factors identified
    mitigating_factors JSONB, -- Risk mitigation measures
    assessment_date TIMESTAMP DEFAULT NOW(),
    next_review_date DATE,
    assessed_by INT REFERENCES users(id),
    review_notes TEXT,
    -- Regulatory Requirements
    edd_required BOOLEAN DEFAULT FALSE, -- Enhanced Due Diligence
    edd_completed BOOLEAN DEFAULT FALSE,
    pep_screening_required BOOLEAN DEFAULT FALSE,
    sanctions_screening_required BOOLEAN DEFAULT FALSE,
    -- Weavr Integration
    weavr_risk_assessment_id VARCHAR(100),
    weavr_risk_score NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 72. Audit Trail (Enhanced)
CREATE TABLE audit_trail (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_subtype VARCHAR(50),
    entity_type VARCHAR(20),
    entity_id VARCHAR(100),
    user_id INT REFERENCES users(id), -- Who performed the action
    session_id VARCHAR(255), -- Session tracking
    ip_address INET,
    user_agent TEXT,
    -- Event Details
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    metadata JSONB, -- Additional context
    -- Compliance
    compliance_relevant BOOLEAN DEFAULT FALSE,
    regulatory_reportable BOOLEAN DEFAULT FALSE,
    -- Weavr Integration
    weavr_event_id VARCHAR(100),
    weavr_correlation_id VARCHAR(100),
    -- Audit Fields
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 73. Security Events
CREATE TABLE security_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) CHECK (event_type IN ('authentication', 'authorization', 'suspicious_activity', 'security_breach', 'data_access')),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id INT REFERENCES users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    -- Event Details
    description TEXT NOT NULL,
    event_data JSONB,
    -- Response
    response_taken TEXT,
    responded_by INT REFERENCES users(id),
    responded_at TIMESTAMP,
    -- Monitoring
    alert_generated BOOLEAN DEFAULT FALSE,
    alert_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Additional Tables for Query Compatibility
-- =========================================

-- 74. Merchants
CREATE TABLE merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    merchant_id VARCHAR(100) UNIQUE,
    category VARCHAR(100),
    country VARCHAR(3),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================================
-- Additional Authentication Tables
-- =========================================

-- 75. Verification Codes (for email/SMS verification)
CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    code VARCHAR(10) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('email', 'sms')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, type)
);

-- 75. Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_accounts_weavr_id ON accounts(weavr_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_merchants_merchant_id ON merchants(merchant_id);
CREATE INDEX idx_merchants_category ON merchants(category);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_consumers_weavr_id ON consumers(weavr_id);
CREATE INDEX idx_consumers_user_id ON consumers(user_id);
CREATE INDEX idx_corporates_weavr_id ON corporates(weavr_id);
CREATE INDEX idx_corporates_user_id ON corporates(user_id);
CREATE INDEX idx_balance_history_account_id ON balance_history(account_id);
CREATE INDEX idx_balance_history_created_at ON balance_history(created_at);
CREATE INDEX idx_weavr_sync_entity ON weavr_sync(entity_type, entity_id);
CREATE INDEX idx_weavr_sync_status ON weavr_sync(sync_status);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);

-- Open Banking indexes
CREATE INDEX idx_open_banking_consents_consent_id ON open_banking_consents(consent_id);
CREATE INDEX idx_open_banking_consents_tpp_id ON open_banking_consents(tpp_id);
CREATE INDEX idx_open_banking_consents_psu_id ON open_banking_consents(psu_id);
CREATE INDEX idx_open_banking_consents_status ON open_banking_consents(consent_status);
CREATE INDEX idx_open_banking_consents_valid_until ON open_banking_consents(valid_until);
CREATE INDEX idx_payment_initiations_payment_id ON payment_initiations(payment_id);
CREATE INDEX idx_payment_initiations_tpp_id ON payment_initiations(tpp_id);
CREATE INDEX idx_payment_initiations_psu_id ON payment_initiations(psu_id);
CREATE INDEX idx_payment_initiations_status ON payment_initiations(status);
CREATE INDEX idx_webhook_subscriptions_subscription_id ON webhook_subscriptions(subscription_id);
CREATE INDEX idx_webhook_subscriptions_tpp_id ON webhook_subscriptions(tpp_id);
CREATE INDEX idx_webhook_subscriptions_status ON webhook_subscriptions(status);
CREATE INDEX idx_webhook_events_open_banking_event_id ON webhook_events_open_banking(event_id);
CREATE INDEX idx_webhook_events_open_banking_tpp_id ON webhook_events_open_banking(tpp_id);
CREATE INDEX idx_webhook_events_open_banking_event_type ON webhook_events_open_banking(event_type);
CREATE INDEX idx_webhook_deliveries_event_id ON webhook_deliveries(event_id);
CREATE INDEX idx_webhook_deliveries_subscription_id ON webhook_deliveries(subscription_id);
CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(success);

-- BaaS indexes
CREATE INDEX idx_baas_customers_customer_id ON baas_customers(customer_id);
CREATE INDEX idx_baas_customers_status ON baas_customers(status);
CREATE INDEX idx_baas_accounts_account_id ON baas_accounts(account_id);
CREATE INDEX idx_baas_accounts_customer_id ON baas_accounts(customer_id);
CREATE INDEX idx_baas_cards_card_id ON baas_cards(card_id);
CREATE INDEX idx_baas_cards_account_id ON baas_cards(account_id);
CREATE INDEX idx_baas_transactions_transaction_id ON baas_transactions(transaction_id);
CREATE INDEX idx_baas_transactions_account_id ON baas_transactions(account_id);

-- Legal Compliance indexes
CREATE INDEX idx_kyc_profiles_user_id ON kyc_profiles(user_id);
CREATE INDEX idx_kyc_profiles_customer_id ON kyc_profiles(customer_id);
CREATE INDEX idx_kyc_profiles_weavr_customer_id ON kyc_profiles(weavr_customer_id);
CREATE INDEX idx_kyc_profiles_kyc_status ON kyc_profiles(kyc_status);
CREATE INDEX idx_kyc_profiles_risk_level ON kyc_profiles(risk_level);
CREATE INDEX idx_kyc_profiles_expires_at ON kyc_profiles(expires_at);

CREATE INDEX idx_aml_screening_results_entity ON aml_screening_results(entity_type, entity_id);
CREATE INDEX idx_aml_screening_results_status ON aml_screening_results(status);
CREATE INDEX idx_aml_screening_results_risk_level ON aml_screening_results(risk_level);
CREATE INDEX idx_aml_screening_results_expires_at ON aml_screening_results(expires_at);

CREATE INDEX idx_regulatory_reports_type ON regulatory_reports(report_type);
CREATE INDEX idx_regulatory_reports_status ON regulatory_reports(status);
CREATE INDEX idx_regulatory_reports_submitted_at ON regulatory_reports(submitted_at);
CREATE INDEX idx_regulatory_reports_reference ON regulatory_reports(reference_number);

CREATE INDEX idx_compliance_incidents_type ON compliance_incidents(incident_type);
CREATE INDEX idx_compliance_incidents_status ON compliance_incidents(status);
CREATE INDEX idx_compliance_incidents_severity ON compliance_incidents(severity);
CREATE INDEX idx_compliance_incidents_occurred_at ON compliance_incidents(occurred_at);

CREATE INDEX idx_data_retention_records_type ON data_retention_records(data_type);
CREATE INDEX idx_data_retention_records_entity ON data_retention_records(entity_type, entity_id);
CREATE INDEX idx_data_retention_records_end_date ON data_retention_records(retention_end_date);
CREATE INDEX idx_data_retention_records_status ON data_retention_records(disposal_status);

CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_customer_id ON consent_records(customer_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_granted ON consent_records(granted);
CREATE INDEX idx_consent_records_expires_at ON consent_records(expires_at);

CREATE INDEX idx_risk_assessments_entity ON risk_assessments(entity_type, entity_id);
CREATE INDEX idx_risk_assessments_type ON risk_assessments(assessment_type);
CREATE INDEX idx_risk_assessments_level ON risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_next_review ON risk_assessments(next_review_date);

CREATE INDEX idx_audit_trail_event_type ON audit_trail(event_type);
CREATE INDEX idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_trail_user ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX idx_audit_trail_weavr_event ON audit_trail(weavr_event_id);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_refresh_expires_at ON sessions(refresh_expires_at);
CREATE INDEX idx_baas_transactions_customer_id ON baas_transactions(customer_id);
CREATE INDEX idx_baas_transactions_type ON baas_transactions(type);
CREATE INDEX idx_baas_transactions_status ON baas_transactions(status);
CREATE INDEX idx_baas_transactions_created_at ON baas_transactions(created_at);

-- Updated transactions table indexes
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_merchant_id ON transactions(merchant_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_weavr_transaction_id ON transactions(weavr_transaction_id);
