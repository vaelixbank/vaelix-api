import pool from '../utils/database';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/crypto';

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
  static async createApiKey(
    user_id: number,
    key: string,
    secret: string,
    type: string = 'client',
    name?: string,
    description?: string,
    expires_at?: Date,
    certificate?: {
      fingerprint: string;
      subject: string;
      issuer: string;
      serial: string;
      pem: string;
    }
  ) {
    const encryptedSecret = encrypt(secret);
    const result = await pool.query(
      `INSERT INTO api_keys (
        user_id, key, secret, type, name, description, expires_at,
        certificate_fingerprint, certificate_subject, certificate_issuer, certificate_serial, certificate_pem,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, user_id, key, type, name, description, expires_at,
               certificate_fingerprint, certificate_subject, certificate_issuer, certificate_serial,
               created_at`,
      [
        user_id, key, encryptedSecret, type, name, description, expires_at,
        certificate?.fingerprint, certificate?.subject, certificate?.issuer, certificate?.serial, certificate?.pem
      ]
    );
    return result.rows[0];
  }

  // Get API key by key and secret
  static async getApiKey(key: string, secret: string) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1',
      [key]
    );
    const apiKey = result.rows[0];
    if (apiKey) {
      try {
        const decryptedSecret = decrypt(apiKey.secret);
        if (decryptedSecret === secret) {
          return apiKey;
        }
      } catch (error) {
        // Invalid encrypted data or wrong key
        console.error('Error decrypting API key secret:', error);
        return null;
      }
    }
    return null;
  }

  // Get API key by key and certificate fingerprint
  static async getApiKeyByCertificateFingerprint(key: string, fingerprint: string) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1 AND certificate_fingerprint = $2',
      [key, fingerprint]
    );
    return result.rows[0] || null;
  }

  // Get user API keys
  static async getUserApiKeys(user_id: number) {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return result.rows;
  }

  // Update API key
  static async updateApiKey(id: number, description?: string, expires_at?: Date) {
    const result = await pool.query(
      'UPDATE api_keys SET description = COALESCE($2, description), expires_at = CASE WHEN $3 IS NOT NULL THEN $3 ELSE expires_at END, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, description, expires_at]
    );
    return result.rows[0];
  }

  // Get all API keys (admin access)
  static async getAllApiKeys(limit: number = 100, offset: number = 0) {
    const result = await pool.query(
      'SELECT id, user_id, key, type, description, expires_at, created_at FROM api_keys ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  // Delete API key
  static async deleteApiKey(id: number) {
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
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

  // Get user roles
  static async getUserRoles(user_id: number) {
    const result = await pool.query(
      'SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user_id]
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

  // =========================================
  // MOBILE AUTH METHODS
  // =========================================

  // Create session for mobile auth
  static async createMobileSession(user_id: number, device_id: string, access_token: string, refresh_token: string) {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const accessExpiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await pool.query(
      `INSERT INTO sessions (id, user_id, device_id, access_token, refresh_token, expires_at, refresh_expires_at, is_active, created_at, last_activity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [sessionId, user_id, device_id, access_token, refresh_token, accessExpiry, refreshExpiry, true, now, now]
    );
    return result.rows[0];
  }

  // Get active session by ID
  static async getActiveSessionById(sessionId: string) {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND is_active = true AND refresh_expires_at > NOW()',
      [sessionId]
    );
    return result.rows[0];
  }

  // Update session activity
  static async updateSessionActivity(sessionId: string) {
    await pool.query(
      'UPDATE sessions SET last_activity = NOW() WHERE id = $1',
      [sessionId]
    );
  }

  // Invalidate session
  static async invalidateSession(sessionId: string) {
    await pool.query(
      'UPDATE sessions SET is_active = false WHERE id = $1',
      [sessionId]
    );
  }

  // Invalidate all user sessions
  static async invalidateAllUserSessions(user_id: number) {
    await pool.query(
      'UPDATE sessions SET is_active = false WHERE user_id = $1',
      [user_id]
    );
  }

  // Create verification code
  static async createVerificationCode(user_id: number, code: string, type: 'email' | 'sms') {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    const result = await pool.query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, type) DO UPDATE SET
       code = EXCLUDED.code,
       expires_at = EXCLUDED.expires_at,
       created_at = EXCLUDED.created_at`,
      [user_id, code, type, expiresAt, new Date()]
    );
    return result.rows[0];
  }

  // Get verification code
  static async getVerificationCode(user_id: number, code: string, type: 'email' | 'sms') {
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = $3 AND expires_at > NOW()',
      [user_id, code, type]
    );
    return result.rows[0];
  }

  // Delete verification code
  static async deleteVerificationCode(user_id: number, type: 'email' | 'sms') {
    await pool.query(
      'DELETE FROM verification_codes WHERE user_id = $1 AND type = $2',
      [user_id, type]
    );
  }

  // Create password reset token
  static async createPasswordResetToken(email: string, token: string) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const result = await pool.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
       token = EXCLUDED.token,
       expires_at = EXCLUDED.expires_at,
       created_at = EXCLUDED.created_at`,
      [email, token, expiresAt, new Date()]
    );
    return result.rows[0];
  }

  // Get password reset token
  static async getPasswordResetToken(token: string) {
    const result = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    return result.rows[0];
  }

  // Delete password reset token
  static async deletePasswordResetToken(token: string) {
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token = $1',
      [token]
    );
  }
}