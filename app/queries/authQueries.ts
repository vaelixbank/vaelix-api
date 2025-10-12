import pool from '../utils/database';

export class AuthQueries {
  // Insert auth factor
  static async createAuthFactor(id: string, type: string, state: string) {
    const result = await pool.query(
      'INSERT INTO auth_factors (id, type, state, created_at) VALUES ($1, $2, $3, NOW())',
      [id, type, state]
    );
    return result.rows[0];
  }

  // Update auth factor
  static async updateAuthFactor(id: string, state?: string) {
    const result = await pool.query(
      'UPDATE auth_factors SET state = COALESCE($2, state), last_used_at = NOW() WHERE id = $1 RETURNING *',
      [id, state]
    );
    return result.rows[0];
  }

  // Get auth factor by ID
  static async getAuthFactorById(id: string) {
    const result = await pool.query('SELECT * FROM auth_factors WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Insert SCA challenge
  static async createScaChallenge(id: string, type: string, method: string, state: string, expires_at: Date) {
    const result = await pool.query(
      'INSERT INTO sca_challenges (id, type, method, state, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
      [id, type, method, state, expires_at]
    );
    return result.rows[0];
  }

  // Update SCA challenge
  static async updateScaChallenge(id: string, state: string) {
    const result = await pool.query(
      'UPDATE sca_challenges SET state = $2, completed_at = CASE WHEN $2 = \'completed\' THEN NOW() ELSE completed_at END WHERE id = $1 RETURNING *',
      [id, state]
    );
    return result.rows[0];
  }

  // Get SCA challenge by ID
  static async getScaChallengeById(id: string) {
    const result = await pool.query('SELECT * FROM sca_challenges WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Insert API key
  static async createApiKey(user_id: number, key: string, secret: string, description?: string) {
    const result = await pool.query(
      'INSERT INTO api_keys (user_id, key, secret, description, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [user_id, key, secret, description]
    );
    return result.rows[0];
  }

  // Get API key by key and secret
  static async getApiKey(key: string, secret: string) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1 AND secret = $2',
      [key, secret]
    );
    return result.rows[0];
  }

  // Get user API keys
  static async getUserApiKeys(user_id: number) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return result.rows;
  }

  // Insert approval
  static async createApproval(transaction_id: number, approver_id: number, approved: boolean) {
    const result = await pool.query(
      'INSERT INTO approvals (transaction_id, approver_id, approved, approved_at) VALUES ($1, $2, $3, CASE WHEN $3 THEN NOW() ELSE NULL END)',
      [transaction_id, approver_id, approved]
    );
    return result.rows[0];
  }

  // Get approvals for transaction
  static async getTransactionApprovals(transaction_id: number) {
    const result = await pool.query(
      'SELECT * FROM approvals WHERE transaction_id = $1 ORDER BY approved_at DESC',
      [transaction_id]
    );
    return result.rows;
  }

  // Insert audit log
  static async createAuditLog(user_id: number, action: string, object_type: string, object_id: number) {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, object_type, object_id, timestamp) VALUES ($1, $2, $3, $4, NOW())',
      [user_id, action, object_type, object_id]
    );
  }

  // Get user audit logs
  static async getUserAuditLogs(user_id: number, limit: number = 100) {
    const result = await pool.query(
      'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [user_id, limit]
    );
    return result.rows;
  }

  // Insert AML flag
  static async createAmlFlag(user_id: number, transaction_id: number, reason: string) {
    await pool.query(
      'INSERT INTO aml_flags (user_id, transaction_id, reason, flagged_at) VALUES ($1, $2, $3, NOW())',
      [user_id, transaction_id, reason]
    );
  }

  // Get AML flags for user
  static async getUserAmlFlags(user_id: number) {
    const result = await pool.query(
      'SELECT * FROM aml_flags WHERE user_id = $1 ORDER BY flagged_at DESC',
      [user_id]
    );
    return result.rows;
  }

  // Insert security incident
  static async createSecurityIncident(incident_type: string, description: string) {
    const result = await pool.query(
      'INSERT INTO security_incidents (incident_type, description, detected_at) VALUES ($1, $2, NOW()) RETURNING id',
      [incident_type, description]
    );
    return result.rows[0];
  }

  // Get recent security incidents
  static async getRecentSecurityIncidents(limit: number = 50) {
    const result = await pool.query(
      'SELECT * FROM security_incidents ORDER BY detected_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  // Insert notification
  static async createNotification(user_id: number, type: string, title: string, message: string) {
    const result = await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [user_id, type, title, message]
    );
    return result.rows[0];
  }

  // Mark notification as read
  static async markNotificationAsRead(id: number) {
    const result = await pool.query(
      'UPDATE notifications SET read = true WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  // Get user notifications
  static async getUserNotifications(user_id: number, limit: number = 50) {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [user_id, limit]
    );
    return result.rows;
  }

  // Get unread notifications count
  static async getUnreadNotificationsCount(user_id: number) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [user_id]
    );
    return parseInt(result.rows[0].count);
  }

  // Insert support ticket
  static async createSupportTicket(user_id: number, title: string, message: string, status: string) {
    const result = await pool.query(
      'INSERT INTO support_tickets (user_id, title, message, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [user_id, title, message, status]
    );
    return result.rows[0];
  }

  // Update support ticket
  static async updateSupportTicket(id: number, status: string) {
    const result = await pool.query(
      'UPDATE support_tickets SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }

  // Get user support tickets
  static async getUserSupportTickets(user_id: number) {
    const result = await pool.query(
      'SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return result.rows;
  }

  // Insert regulatory report
  static async createRegulatoryReport(report_type: string, content: string) {
    const result = await pool.query(
      'INSERT INTO regulatory_reports (report_type, content, generated_at) VALUES ($1, $2, NOW()) RETURNING id',
      [report_type, content]
    );
    return result.rows[0];
  }

  // Get regulatory reports
  static async getRegulatoryReports(limit: number = 100) {
    const result = await pool.query(
      'SELECT * FROM regulatory_reports ORDER BY generated_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }

  // Insert board member
  static async createBoardMember(full_name: string, position: string, joined_at: string, status: string) {
    const result = await pool.query(
      'INSERT INTO board_members (full_name, position, joined_at, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [full_name, position, joined_at, status]
    );
    return result.rows[0];
  }

  // Get all board members
  static async getAllBoardMembers() {
    const result = await pool.query('SELECT * FROM board_members ORDER BY joined_at DESC');
    return result.rows;
  }

  // Insert protocol version
  static async createProtocolVersion(version: string, description: string, released_at?: Date) {
    const result = await pool.query(
      'INSERT INTO protocol_versions (version, description, released_at) VALUES ($1, $2, $3) RETURNING id',
      [version, description, released_at]
    );
    return result.rows[0];
  }

  // Get latest protocol version
  static async getLatestProtocolVersion() {
    const result = await pool.query(
      'SELECT * FROM protocol_versions ORDER BY released_at DESC LIMIT 1'
    );
    return result.rows[0];
  }

  // Insert VBG node
  static async createVbgNode(node_name: string, location: string, status: string) {
    const result = await pool.query(
      'INSERT INTO vbg_nodes (node_name, location, status, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
      [node_name, location, status]
    );
    return result.rows[0];
  }

  // Get all VBG nodes
  static async getAllVbgNodes() {
    const result = await pool.query('SELECT * FROM vbg_nodes ORDER BY created_at DESC');
    return result.rows;
  }

  // Update VBG node status
  static async updateVbgNodeStatus(id: number, status: string) {
    const result = await pool.query(
      'UPDATE vbg_nodes SET status = $2 WHERE id = $1 RETURNING *',
      [id, status]
    );
    return result.rows[0];
  }
}