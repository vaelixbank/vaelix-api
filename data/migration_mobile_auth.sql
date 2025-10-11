-- Migration for mobile authentication features
-- Run this after the main schema setup

-- Add password hash and mobile auth fields to users table
ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255),
ADD COLUMN device_id VARCHAR(255),
ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN last_login TIMESTAMP;

-- Create sessions table for mobile session management
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    refresh_expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity TIMESTAMP DEFAULT NOW()
);

-- Create verification codes table for email/SMS verification
CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, type)
);

-- Create password reset tokens table
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    token VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_device_id ON sessions (device_id);
CREATE INDEX idx_sessions_active ON sessions (is_active, refresh_expires_at);
CREATE INDEX idx_verification_codes_user_type ON verification_codes (user_id, type);
CREATE INDEX idx_verification_codes_expires ON verification_codes (expires_at);
CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens (email);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens (token);

-- Add some sample data for testing (remove in production)
-- INSERT INTO users (email, phone, full_name, password_hash, is_verified, created_at)
-- VALUES ('test@example.com', '+33123456789', 'Test User', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6fMmiP2VyK', true, NOW());