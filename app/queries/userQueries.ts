import pool from '../utils/database';

export class UserQueries {
  // Insert new user
  static async createUser(email: string, full_name: string, phone?: string, kyc_status?: string) {
    const result = await pool.query(
      'INSERT INTO users (email, full_name, phone, kyc_status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
      [email, full_name, phone, kyc_status]
    );
    return result.rows[0];
  }

  // Update user
  static async updateUser(id: number, full_name?: string, phone?: string, kyc_status?: string) {
    const result = await pool.query(
      'UPDATE users SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), kyc_status = COALESCE($4, kyc_status), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, full_name, phone, kyc_status]
    );
    return result.rows[0];
  }

  // Select user by ID
  static async getUserById(id: number) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Select user by email
  static async getUserByEmail(email: string) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Select all users
  static async getAllUsers() {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  }

  // Delete user
  static async deleteUser(id: number) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Insert user role
  static async assignUserRole(user_id: number, role_id: number) {
    const result = await pool.query(
      'INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())',
      [user_id, role_id]
    );
    return result.rows[0];
  }

  // Select user roles
  static async getUserRoles(user_id: number) {
    const result = await pool.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user_id]
    );
    return result.rows;
  }

  // Insert session
  static async createSession(user_id: number, session_token: string, expires_at: Date) {
    const result = await pool.query(
      'INSERT INTO sessions (user_id, session_token, expires_at, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [user_id, session_token, expires_at]
    );
    return result.rows[0];
  }

  // Update session last activity
  static async updateSessionActivity(id: string) {
    await pool.query('UPDATE sessions SET last_activity = NOW() WHERE id = $1', [id]);
  }

  // Delete expired sessions
  static async deleteExpiredSessions() {
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
  }

  // Get active session
  static async getActiveSession(session_token: string) {
    const result = await pool.query(
      'SELECT s.*, u.email, u.full_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = $1 AND s.expires_at > NOW()',
      [session_token]
    );
    return result.rows[0];
  }

  // Insert login attempt
  static async createLoginAttempt(user_id: number, ip_address: string, success: boolean) {
    await pool.query(
      'INSERT INTO login_attempts (user_id, ip_address, success, attempted_at) VALUES ($1, $2, $3, NOW())',
      [user_id, ip_address, success]
    );
  }

  // Check login attempts (last 24 hours)
  static async getLoginAttemptsLast24h(user_id: number) {
    const result = await pool.query(
      'SELECT COUNT(*) as attempts FROM login_attempts WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL \'24 hours\' AND success = false',
      [user_id]
    );
    return parseInt(result.rows[0].attempts);
  }

  // Insert consumer
  static async createConsumer(id: string, user_id: number, state: string, root_user: any, kyc?: any) {
    const result = await pool.query(
      'INSERT INTO consumers (id, user_id, type, state, root_user, kyc, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
      [id, user_id, 'consumer', state, JSON.stringify(root_user), kyc ? JSON.stringify(kyc) : null]
    );
    return result.rows[0];
  }

  // Update consumer
  static async updateConsumer(id: string, state?: string, kyc?: any) {
    const result = await pool.query(
      'UPDATE consumers SET state = COALESCE($2, state), kyc = COALESCE($3, kyc), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, state, kyc ? JSON.stringify(kyc) : null]
    );
    return result.rows[0];
  }

  // Get consumer by ID
  static async getConsumerById(id: string) {
    const result = await pool.query('SELECT * FROM consumers WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Insert corporate
  static async createCorporate(id: string, user_id: number, state: string, root_user: any, kyb?: any, company?: any) {
    const result = await pool.query(
      'INSERT INTO corporates (id, user_id, type, state, root_user, kyb, company, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
      [id, user_id, 'corporate', state, JSON.stringify(root_user), kyb ? JSON.stringify(kyb) : null, company ? JSON.stringify(company) : null]
    );
    return result.rows[0];
  }

  // Update corporate
  static async updateCorporate(id: string, state?: string, kyb?: any, company?: any) {
    const result = await pool.query(
      'UPDATE corporates SET state = COALESCE($2, state), kyb = COALESCE($3, kyb), company = COALESCE($4, company), updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, state, kyb ? JSON.stringify(kyb) : null, company ? JSON.stringify(company) : null]
    );
    return result.rows[0];
  }

  // Get corporate by ID
  static async getCorporateById(id: string) {
    const result = await pool.query('SELECT * FROM corporates WHERE id = $1', [id]);
    return result.rows[0];
  }
}