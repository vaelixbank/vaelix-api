-- =========================================
-- PostgreSQl Schema VBG Ledger - 54 tables
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
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Transactions
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(id),
    amount NUMERIC(30,2) NOT NULL,
    currency CHAR(3) DEFAULT 'EUR',
    type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Transaction Audit
CREATE TABLE transaction_audit (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
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
    type VARCHAR(20) CHECK (type IN ('client', 'server')),
    description TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Approvals
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    transaction_id INT REFERENCES transactions(id),
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
    transaction_id INT REFERENCES transactions(id),
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
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    session_token VARCHAR(255),
    expires_at TIMESTAMP,
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
    transaction_id INT REFERENCES transactions(id),
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
    transaction_id INT REFERENCES transactions(id),
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

-- Indexes for performance
CREATE INDEX idx_accounts_weavr_id ON accounts(weavr_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_status ON accounts(status);
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
