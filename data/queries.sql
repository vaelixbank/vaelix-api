-- =========================================
-- SQL Queries for Vaelix Bank API
-- Based on schema-pgsql.sql
-- =========================================

-- =========================================
-- USERS AND AUTHENTICATION
-- =========================================

-- Insert new user
INSERT INTO users (email, full_name, phone, kyc_status, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING id;

-- Update user
UPDATE users
SET full_name = $2, phone = $3, kyc_status = $4, updated_at = NOW()
WHERE id = $1;

-- Select user by ID
SELECT * FROM users WHERE id = $1;

-- Select user by email
SELECT * FROM users WHERE email = $1;

-- Insert user role
INSERT INTO user_roles (user_id, role_id, assigned_at)
VALUES ($1, $2, NOW());

-- Select user roles
SELECT r.name FROM roles r
JOIN user_roles ur ON r.id = ur.role_id
WHERE ur.user_id = $1;

-- Insert session
INSERT INTO sessions (user_id, session_token, expires_at, created_at)
VALUES ($1, $2, $3, NOW())
RETURNING id;

-- Update session last activity
UPDATE sessions
SET last_activity = NOW()
WHERE id = $1;

-- Delete expired sessions
DELETE FROM sessions WHERE expires_at < NOW();

-- Insert login attempt
INSERT INTO login_attempts (user_id, ip_address, success, attempted_at)
VALUES ($1, $2, $3, NOW());

-- Check login attempts (last 24 hours)
SELECT COUNT(*) FROM login_attempts
WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL '24 hours' AND success = false;

-- =========================================
-- ACCOUNTS AND FINANCIAL OPERATIONS
-- =========================================

-- Insert account
INSERT INTO accounts (user_id, account_number, account_type, currency, balance, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
RETURNING id;

-- Update account balance
UPDATE accounts
SET balance = balance + $2, updated_at = NOW()
WHERE id = $1;

-- Select account by ID
SELECT * FROM accounts WHERE id = $1;

-- Select user accounts
SELECT * FROM accounts WHERE user_id = $1;

-- Insert wallet
INSERT INTO wallets (user_id, account_id, wallet_type, balance, currency, created_at)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING id;

-- Update wallet balance
UPDATE wallets
SET balance = balance + $2
WHERE id = $1;

-- Insert transaction
INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
RETURNING id;

-- Update transaction status
UPDATE transactions
SET status = $2, updated_at = NOW()
WHERE id = $1;

-- Select transactions by account
SELECT * FROM transactions WHERE account_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- Insert transaction audit
INSERT INTO transaction_audit (transaction_id, action, performed_by, timestamp)
VALUES ($1, $2, $3, NOW());

-- Check transaction limits
SELECT daily_limit, monthly_limit FROM transaction_limits WHERE account_id = $1;

-- Insert FX rate
INSERT INTO fx_rates (from_currency, to_currency, rate, updated_at)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (from_currency, to_currency) DO UPDATE SET rate = $3, updated_at = NOW();

-- Get FX rate
SELECT rate FROM fx_rates WHERE from_currency = $1 AND to_currency = $2;

-- =========================================
-- CARDS AND PAYMENTS
-- =========================================

-- Insert VIBAN/Card
INSERT INTO vibans_cards (user_id, viban_id, iban, currency, status, created_at)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING id;

-- Update card status
UPDATE vibans_cards
SET status = $2
WHERE id = $1;

-- Select user cards
SELECT * FROM vibans_cards WHERE user_id = $1;

-- Insert card transaction
INSERT INTO card_transactions (card_id, amount, currency, merchant, status, created_at)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING id;

-- Update card transaction status
UPDATE card_transactions
SET status = $2
WHERE id = $1;

-- Select card transactions
SELECT * FROM card_transactions WHERE card_id = $1 ORDER BY created_at DESC;

-- Insert interbank transfer
INSERT INTO interbank_transfers (from_account, to_account_number, amount, currency, status, initiated_at)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING id;

-- Update transfer status
UPDATE interbank_transfers
SET status = $2, completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE NULL END
WHERE id = $1;

-- Insert payment request
INSERT INTO payment_requests (account_id, amount, currency, status, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING id;

-- =========================================
-- BENEFICIARIES AND BULK OPERATIONS
-- =========================================

-- Insert beneficiary
INSERT INTO beneficiaries (id, profile_id, name, type, state, details, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());

-- Update beneficiary
UPDATE beneficiaries
SET name = $2, state = $3, details = $4, updated_at = NOW()
WHERE id = $1;

-- Select beneficiaries by profile
SELECT * FROM beneficiaries WHERE profile_id = $1;

-- Insert beneficiary batch
INSERT INTO beneficiary_batches (id, profile_id, state, beneficiaries, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW());

-- Update batch state
UPDATE beneficiary_batches
SET state = $2, updated_at = NOW()
WHERE id = $1;

-- Insert bulk process
INSERT INTO bulk_processes (id, type, state, progress, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING id;

-- Update bulk process
UPDATE bulk_processes
SET state = $2, progress = $3, started_at = CASE WHEN $2 = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END,
    completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END,
    paused_at = CASE WHEN $2 = 'paused' THEN NOW() ELSE paused_at END,
    cancelled_at = CASE WHEN $2 = 'cancelled' THEN NOW() ELSE cancelled_at END
WHERE id = $1;

-- Insert bulk operation
INSERT INTO bulk_operations (id, bulk_id, type, state, data, created_at)
VALUES ($1, $2, $3, $4, $5, NOW());

-- Update bulk operation
UPDATE bulk_operations
SET state = $2, result = $3, error = $4, completed_at = NOW()
WHERE id = $1;

-- =========================================
-- IDENTITY MANAGEMENT
-- =========================================

-- Insert consumer
INSERT INTO consumers (id, user_id, type, state, root_user, kyc, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());

-- Update consumer
UPDATE consumers
SET state = $2, kyc = $3, updated_at = NOW()
WHERE id = $1;

-- Insert corporate
INSERT INTO corporates (id, user_id, type, state, root_user, kyb, company, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());

-- Update corporate
UPDATE corporates
SET state = $2, kyb = $3, company = $4, updated_at = NOW()
WHERE id = $1;

-- =========================================
-- LINKED ACCOUNTS
-- =========================================

-- Insert linked account
INSERT INTO linked_accounts (id, profile_id, name, state, type, currency, balance, bank_details, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW());

-- Update linked account
UPDATE linked_accounts
SET name = $2, state = $3, balance = $4, updated_at = NOW()
WHERE id = $1;

-- Insert account identifier
INSERT INTO account_identifiers (linked_account_id, type, identification)
VALUES ($1, $2, $3);

-- Select linked accounts by profile
SELECT la.*, array_agg(ai.identification) as identifiers
FROM linked_accounts la
LEFT JOIN account_identifiers ai ON la.id = ai.linked_account_id
WHERE la.profile_id = $1
GROUP BY la.id;

-- =========================================
-- AUTHENTICATION AND SECURITY
-- =========================================

-- Insert auth factor
INSERT INTO auth_factors (id, type, state, created_at)
VALUES ($1, $2, $3, NOW());

-- Update auth factor
UPDATE auth_factors
SET state = $2, last_used_at = NOW()
WHERE id = $1;

-- Insert SCA challenge
INSERT INTO sca_challenges (id, type, method, state, expires_at, created_at)
VALUES ($1, $2, $3, $4, $5, NOW());

-- Update SCA challenge
UPDATE sca_challenges
SET state = $2, completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END
WHERE id = $1;

-- Insert API key
INSERT INTO api_keys (user_id, key, secret, description, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING id;

-- Select API key
SELECT * FROM api_keys WHERE key = $1 AND secret = $2;

-- Insert approval
INSERT INTO approvals (transaction_id, approver_id, approved, approved_at)
VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END);

-- Insert audit log
INSERT INTO audit_logs (user_id, action, object_type, object_id, timestamp)
VALUES ($1, $2, $3, $4, NOW());

-- Insert fraud detection
INSERT INTO fraud_detection (transaction_id, risk_level, flagged_at)
VALUES ($1, $2, NOW());

-- Insert security incident
INSERT INTO security_incidents (incident_type, description, detected_at)
VALUES ($1, $2, NOW());

-- =========================================
-- OTHER ENTITIES
-- =========================================

-- Insert notification
INSERT INTO notifications (user_id, type, title, message, created_at)
VALUES ($1, $2, $3, $4, NOW());

-- Mark notification as read
UPDATE notifications
SET read = true
WHERE id = $1;

-- Select user notifications
SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC;

-- Insert investment
INSERT INTO investments (user_id, type, amount, currency, created_at)
VALUES ($1, $2, $3, $4, NOW());

-- Insert loan
INSERT INTO loans (user_id, principal, interest_rate, term_months, status, created_at)
VALUES ($1, $2, $3, $4, $5, NOW());

-- Update loan status
UPDATE loans
SET status = $2
WHERE id = $1;

-- Insert saving
INSERT INTO savings (user_id, balance, interest_rate, currency, created_at)
VALUES ($1, $2, $3, $4, NOW());

-- Update saving balance
UPDATE savings
SET balance = balance + $2
WHERE id = $1;

-- Insert KYC document
INSERT INTO kyc_documents (user_id, document_type, document_url, status, uploaded_at)
VALUES ($1, $2, $3, $4, NOW());

-- Update KYC document status
UPDATE kyc_documents
SET status = $2
WHERE id = $1;

-- Insert insurance contract
INSERT INTO insurance_contracts (user_id, policy_number, coverage_amount, status, start_date, end_date)
VALUES ($1, $2, $3, $4, $5, $6);

-- Insert support ticket
INSERT INTO support_tickets (user_id, title, message, status, created_at)
VALUES ($1, $2, $3, $4, NOW());

-- Update support ticket
UPDATE support_tickets
SET status = $2
WHERE id = $1;

-- Insert AML flag
INSERT INTO aml_flags (user_id, transaction_id, reason, flagged_at)
VALUES ($1, $2, $3, NOW());

-- Insert ledger snapshot
INSERT INTO ledger_snapshots (snapshot_date, total_balance)
VALUES (NOW(), $1);

-- Insert regulatory report
INSERT INTO regulatory_reports (report_type, content, generated_at)
VALUES ($1, $2, NOW());

-- Insert wealth portfolio
INSERT INTO wealth_portfolios (user_id, portfolio_name, total_value, created_at)
VALUES ($1, $2, $3, NOW());

-- Update wealth portfolio
UPDATE wealth_portfolios
SET total_value = $2
WHERE id = $1;