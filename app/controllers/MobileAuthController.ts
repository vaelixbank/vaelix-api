import { Request, Response } from 'express';
import { mobileAuthService } from '../services/mobileAuthService';
import { MobileLoginRequest, MobileRegisterRequest, RefreshTokenRequest, VerificationRequest, PasswordResetRequest, PasswordResetConfirmRequest } from '../models/Auth';

export class MobileAuthController {
  // Register new user
  static async register(req: Request, res: Response) {
    try {
      const data: MobileRegisterRequest = req.body;

      // Check if user already exists
      const existingUser = await mobileAuthService.checkUserExists(data.email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }

      // Register user
      const user = await mobileAuthService.register(data);

      // Send verification code
      await mobileAuthService.sendVerificationCode(user.id, 'email');

      res.status(201).json({
        message: 'User registered successfully. Please verify your email.',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_verified: user.is_verified
        },
        requires_verification: true
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  // Login user
  static async login(req: Request, res: Response) {
    try {
      const data: MobileLoginRequest = req.body;

      const result = await mobileAuthService.login(data);

      if (!result) {
        return res.status(401).json({
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const { user, tokens, session } = result;

      res.json({
        ...tokens,
        session_id: session.id,
        user
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Refresh tokens
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refresh_token }: RefreshTokenRequest = req.body;

      const tokens = await mobileAuthService.refreshTokens(refresh_token);

      if (!tokens) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      res.json(tokens);
    } catch (error: any) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  // Logout (invalidate session)
  static async logout(req: Request, res: Response) {
    try {
      const sessionId = req.headers['x-session-id'] as string;

      if (sessionId) {
        await mobileAuthService.invalidateSession(sessionId);
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Send verification code
  static async sendVerification(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { type }: { type: 'email' | 'sms' } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await mobileAuthService.sendVerificationCode(userId, type);

      res.json({
        message: `Verification code sent to ${type}`,
        type
      });
    } catch (error: any) {
      console.error('Send verification error:', error);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  }

  // Verify code
  static async verifyCode(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { code, type }: VerificationRequest = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const isValid = await mobileAuthService.verifyCode(userId, code, type);

      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid or expired verification code',
          code: 'INVALID_CODE'
        });
      }

      res.json({
        message: 'Account verified successfully',
        verified: true
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }

  // Password reset request
  static async passwordResetRequest(req: Request, res: Response) {
    try {
      const { email }: PasswordResetRequest = req.body;

      // Check if user exists
      const userExists = await mobileAuthService.checkUserExists(email);
      if (!userExists) {
        // Don't reveal if user exists or not for security
        return res.json({
          message: 'If the email exists, a reset link has been sent'
        });
      }

      // Generate reset token and send email
      const resetToken = await mobileAuthService.generatePasswordResetToken(email);

      // Here you would send email with reset link
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        message: 'If the email exists, a reset link has been sent'
      });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Password reset request failed' });
    }
  }

  // Password reset confirm
  static async passwordResetConfirm(req: Request, res: Response) {
    try {
      const { token, new_password }: PasswordResetConfirmRequest = req.body;

      const success = await mobileAuthService.resetPassword(token, new_password);

      if (!success) {
        return res.status(400).json({
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error: any) {
      console.error('Password reset confirm error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      res.json({ user });
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}