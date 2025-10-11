import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../utils/database';
import { MobileUser, AuthTokens, Session, MobileLoginRequest, MobileRegisterRequest } from '../models/Auth';

export class MobileAuthService {
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate tokens
  private generateTokens(user: MobileUser): AuthTokens {
    const access_token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'access'
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry } as jwt.SignOptions
    );

    const refresh_token = jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiry } as jwt.SignOptions
    );

    return {
      access_token,
      refresh_token,
      token_type: 'Bearer',
      expires_in: 15 * 60, // 15 minutes in seconds
      user
    };
  }

  // Verify access token
  async verifyAccessToken(token: string): Promise<MobileUser | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (decoded.type !== 'access') {
        return null;
      }

      // Get user from database
      const result = await pool.query(
        'SELECT id, email, phone, full_name, device_id, is_verified, kyc_status, created_at, last_login FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0] as MobileUser;
    } catch (error) {
      return null;
    }
  }

  // Verify refresh token
  async verifyRefreshToken(token: string): Promise<number | null> {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      return decoded.userId;
    } catch (error) {
      return null;
    }
  }

  // Create session
  async createSession(userId: number, deviceId: string, tokens: AuthTokens): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const accessExpiry = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await pool.query(
      `INSERT INTO sessions (id, user_id, device_id, access_token, refresh_token, expires_at, refresh_expires_at, is_active, created_at, last_activity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [sessionId, userId, deviceId, tokens.access_token, tokens.refresh_token, accessExpiry, refreshExpiry, true, now, now]
    );

    return result.rows[0] as Session;
  }

  // Get active session
  async getActiveSession(sessionId: string): Promise<Session | null> {
    const result = await pool.query(
      'SELECT * FROM sessions WHERE id = $1 AND is_active = true AND refresh_expires_at > NOW()',
      [sessionId]
    );

    return result.rows.length > 0 ? result.rows[0] as Session : null;
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    await pool.query(
      'UPDATE sessions SET last_activity = NOW() WHERE id = $1',
      [sessionId]
    );
  }

  // Invalidate session
  async invalidateSession(sessionId: string): Promise<void> {
    await pool.query(
      'UPDATE sessions SET is_active = false WHERE id = $1',
      [sessionId]
    );
  }

  // Invalidate all user sessions
  async invalidateAllUserSessions(userId: number): Promise<void> {
    await pool.query(
      'UPDATE sessions SET is_active = false WHERE user_id = $1',
      [userId]
    );
  }

  // Register new user
  async register(data: MobileRegisterRequest): Promise<MobileUser> {
    const hashedPassword = await this.hashPassword(data.password);

    const result = await pool.query(
      `INSERT INTO users (email, phone, full_name, password_hash, device_id, is_verified, kyc_status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, phone, full_name, device_id, is_verified, kyc_status, created_at`,
      [data.email, data.phone, data.full_name, hashedPassword, data.device_id, false, 'pending', new Date()]
    );

    return result.rows[0] as MobileUser;
  }

  // Login user
  async login(data: MobileLoginRequest): Promise<{ user: MobileUser; tokens: AuthTokens; session: Session } | null> {
    // Find user by email
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [data.email]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // Verify password if provided
    if (data.password) {
      const isValidPassword = await this.verifyPassword(data.password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW(), device_id = $1 WHERE id = $2',
      [data.device_id, user.id]
    );

    // Create user object without password
    const mobileUser: MobileUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      device_id: user.device_id,
      is_verified: user.is_verified,
      kyc_status: user.kyc_status,
      created_at: user.created_at,
      last_login: new Date()
    };

    // Generate tokens
    const tokens = this.generateTokens(mobileUser);

    // Create session
    const session = await this.createSession(user.id, data.device_id, tokens);

    return { user: mobileUser, tokens, session };
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
    const userId = await this.verifyRefreshToken(refreshToken);
    if (!userId) {
      return null;
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, email, phone, full_name, device_id, is_verified, kyc_status, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0] as MobileUser;

    // Generate new tokens
    return this.generateTokens(user);
  }

  // Send verification code
  async sendVerificationCode(userId: number, type: 'email' | 'sms'): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code (you might want to use Redis for this)
    await pool.query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, type) DO UPDATE SET
       code = EXCLUDED.code,
       expires_at = EXCLUDED.expires_at,
       created_at = EXCLUDED.created_at`,
      [userId, code, type, new Date(Date.now() + 10 * 60 * 1000), new Date()] // 10 minutes expiry
    );

    // Here you would integrate with SMS/email service
    // For now, just return the code (in production, send via service)
    console.log(`Verification code for ${type}: ${code}`);

    return code;
  }

  // Verify code
  async verifyCode(userId: number, code: string, type: 'email' | 'sms'): Promise<boolean> {
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE user_id = $1 AND code = $2 AND type = $3 AND expires_at > NOW()',
      [userId, code, type]
    );

    if (result.rows.length > 0) {
      // Mark user as verified
      await pool.query(
        'UPDATE users SET is_verified = true WHERE id = $1',
        [userId]
      );

      // Clean up verification code
      await pool.query(
        'DELETE FROM verification_codes WHERE user_id = $1 AND type = $2',
        [userId, type]
      );

      return true;
    }

    return false;
  }

  // Check if user exists
  async checkUserExists(email: string): Promise<boolean> {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    return result.rows.length > 0;
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (email, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
       token = EXCLUDED.token,
       expires_at = EXCLUDED.expires_at,
       created_at = EXCLUDED.created_at`,
      [email, token, expiresAt, new Date()]
    );

    return token;
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT email FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return false;
    }

    const email = result.rows[0].email;
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    // Clean up token
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    return true;
  }
}

export const mobileAuthService = new MobileAuthService();