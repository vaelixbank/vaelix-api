import pool from '../utils/database';

export class ServiceQueries {
  // Create service integration
  static async createServiceIntegration(service_name: string, api_key: string, auth_token: string, base_url?: string) {
    const result = await pool.query(
      'INSERT INTO service_integrations (service_name, api_key, auth_token, base_url, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, true, NOW(), NOW()) RETURNING *',
      [service_name, api_key, auth_token, base_url]
    );
    return result.rows[0];
  }

  // Get service integration by name
  static async getServiceIntegration(service_name: string) {
    const result = await pool.query(
      'SELECT * FROM service_integrations WHERE service_name = $1 AND is_active = true',
      [service_name]
    );
    return result.rows[0];
  }

  // Get all service integrations
  static async getAllServiceIntegrations() {
    const result = await pool.query(
      'SELECT * FROM service_integrations ORDER BY created_at DESC'
    );
    return result.rows;
  }

  // Update service integration
  static async updateServiceIntegration(id: number, api_key?: string, auth_token?: string, base_url?: string, is_active?: boolean) {
    const result = await pool.query(
      'UPDATE service_integrations SET api_key = COALESCE($2, api_key), auth_token = COALESCE($3, auth_token), base_url = COALESCE($4, base_url), is_active = COALESCE($5, is_active), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, api_key, auth_token, base_url, is_active]
    );
    return result.rows[0];
  }

  // Delete service integration
  static async deleteServiceIntegration(id: number) {
    const result = await pool.query(
      'DELETE FROM service_integrations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }
}