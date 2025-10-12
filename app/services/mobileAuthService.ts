import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserQueries } from '../queries/userQueries';
import { AuthQueries } from '../queries/authQueries';
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
      const user = await UserQueries.getUserById(decoded.userId);

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name,
        device_id: user.device_id,
        is_verified: user.is_verified,
        kyc_status: user.kyc_status,
        created_at: user.created_at,
        last_login: user.last_login
      } as MobileUser;
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
    return await AuthQueries.createMobileSession(userId, deviceId, tokens.access_token, tokens.refresh_token);
  }

  // Get active session
  async getActiveSession(sessionId: string): Promise<Session | null> {
    return await AuthQueries.getActiveSessionById(sessionId);
  }

  // Update session activity
  async updateSessionActivity(sessionId: string): Promise<void> {
    await AuthQueries.updateSessionActivity(sessionId);
  }

  // Invalidate session
  async invalidateSession(sessionId: string): Promise<void> {
    await AuthQueries.invalidateSession(sessionId);
  }

  // Invalidate all user sessions
  async invalidateAllUserSessions(userId: number): Promise<void> {
    await AuthQueries.invalidateAllUserSessions(userId);
  }

  // Register new user
  async register(data: MobileRegisterRequest): Promise<MobileUser> {
    const hashedPassword = await this.hashPassword(data.password);
    return await UserQueries.createUserWithPassword(data.email, data.full_name, data.phone, hashedPassword, data.device_id);
  }

  // Login user
  async login(data: MobileLoginRequest): Promise<{ user: MobileUser; tokens: AuthTokens; session: Session } | null> {
    // Find user by email
    const user = await UserQueries.getUserByEmailWithPassword(data.email);

    if (!user) {
      return null;
    }

    // Verify password if provided
    if (data.password) {
      const isValidPassword = await this.verifyPassword(data.password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }
    }

    // Update last login and device
    await UserQueries.updateUserDeviceAndLogin(user.id, data.device_id);

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
    const user = await UserQueries.getUserById(userId);

    if (!user) {
      return null;
    }

    const mobileUser: MobileUser = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      device_id: user.device_id,
      is_verified: user.is_verified,
      kyc_status: user.kyc_status,
      created_at: user.created_at,
      last_login: user.last_login
    };

    // Generate new tokens
    return this.generateTokens(mobileUser);
  }

  // Send verification code
  async sendVerificationCode(userId: number, type: 'email' | 'sms'): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification code
    await AuthQueries.createVerificationCode(userId, code, type);

    // Here you would integrate with SMS/email service
    // For now, just return the code (in production, send via service)
    console.log(`Verification code for ${type}: ${code}`);

    return code;
  }

  // Verify code
  async verifyCode(userId: number, code: string, type: 'email' | 'sms'): Promise<boolean> {
    const verificationCode = await AuthQueries.getVerificationCode(userId, code, type);

    if (verificationCode) {
      // Mark user as verified
      await UserQueries.markUserAsVerified(userId);

      // Clean up verification code
      await AuthQueries.deleteVerificationCode(userId, type);

      return true;
    }

    return false;
  }

  // Check if user exists
  async checkUserExists(email: string): Promise<boolean> {
    const user = await UserQueries.getUserByEmail(email);
    return !!user;
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await AuthQueries.createPasswordResetToken(email, token);
    return token;
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const resetToken = await AuthQueries.getPasswordResetToken(token);

    if (!resetToken) {
      return false;
    }

    const hashedPassword = await this.hashPassword(newPassword);

    // Update password - need to get user by email first
    const user = await UserQueries.getUserByEmail(resetToken.email);
    if (!user) {
      return false;
    }

    await UserQueries.updateUserPassword(user.id, hashedPassword);

    // Clean up token
    await AuthQueries.deletePasswordResetToken(token);

    return true;
  }
}

export const mobileAuthService = new MobileAuthService();