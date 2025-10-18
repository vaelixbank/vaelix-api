-- Migration: Add certificate-based authentication fields to api_keys table
-- This migration adds support for X.509 certificate authentication alongside traditional key-secret auth

-- Add certificate fields to api_keys table
ALTER TABLE api_keys
ADD COLUMN certificate_fingerprint VARCHAR(255),
ADD COLUMN certificate_subject TEXT,
ADD COLUMN certificate_issuer TEXT,
ADD COLUMN certificate_serial VARCHAR(255),
ADD COLUMN certificate_pem TEXT;

-- Create index on certificate fingerprint for efficient lookups
CREATE INDEX idx_api_keys_certificate_fingerprint ON api_keys(certificate_fingerprint);

-- Add constraint to ensure either secret or certificate is provided
ALTER TABLE api_keys
ADD CONSTRAINT api_keys_auth_method_check
CHECK (
  (secret IS NOT NULL AND certificate_fingerprint IS NULL) OR
  (secret IS NULL AND certificate_fingerprint IS NOT NULL) OR
  (secret IS NOT NULL AND certificate_fingerprint IS NOT NULL)
);

-- Add comment for documentation
COMMENT ON COLUMN api_keys.certificate_fingerprint IS 'SHA-256 fingerprint of the X.509 certificate for mutual TLS authentication';
COMMENT ON COLUMN api_keys.certificate_subject IS 'Subject field from the X.509 certificate';
COMMENT ON COLUMN api_keys.certificate_issuer IS 'Issuer field from the X.509 certificate';
COMMENT ON COLUMN api_keys.certificate_serial IS 'Serial number from the X.509 certificate';
COMMENT ON COLUMN api_keys.certificate_pem IS 'PEM-encoded X.509 certificate for validation';