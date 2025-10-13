-- Migration: Add service_integrations table for storing third-party service credentials
-- This allows the API to store Weavr API keys server-side instead of requiring clients to provide them

CREATE TABLE IF NOT EXISTS service_integrations (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    auth_token TEXT NOT NULL,
    base_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_integrations_service_name ON service_integrations(service_name);
CREATE INDEX IF NOT EXISTS idx_service_integrations_active ON service_integrations(is_active);

-- Insert default Weavr integration (will be configured via API)
-- Note: Actual credentials should be set via the API after deployment
INSERT INTO service_integrations (service_name, api_key, auth_token, base_url)
VALUES ('weavr', '', '', 'https://api.weavr.io')
ON CONFLICT (service_name) DO NOTHING;