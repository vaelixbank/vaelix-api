"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileAuthController = void 0;
const mobileAuthService_1 = require("../services/mobileAuthService");
class MobileAuthController {
    // Register new user
    static async register(req, res) {
        try {
            const data = req.body;
            // Check if user already exists
            const existingUser = await mobileAuthService_1.mobileAuthService.checkUserExists(data.email);
            if (existingUser) {
                return res.status(409).json({
                    error: 'User with this email already exists',
                    code: 'USER_EXISTS'
                });
            }
            // Register user
            const user = await mobileAuthService_1.mobileAuthService.register(data);
            // Send verification code
            await mobileAuthService_1.mobileAuthService.sendVerificationCode(user.id, 'email');
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
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    // Login user
    static async login(req, res) {
        try {
            const data = req.body;
            const result = await mobileAuthService_1.mobileAuthService.login(data);
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
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
    // Refresh tokens
    static async refreshToken(req, res) {
        try {
            const { refresh_token } = req.body;
            const tokens = await mobileAuthService_1.mobileAuthService.refreshTokens(refresh_token);
            if (!tokens) {
                return res.status(401).json({
                    error: 'Invalid refresh token',
                    code: 'INVALID_REFRESH_TOKEN'
                });
            }
            res.json(tokens);
        }
        catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({ error: 'Token refresh failed' });
        }
    }
    // Logout (invalidate session)
    static async logout(req, res) {
        try {
            const sessionId = req.headers['x-session-id'];
            if (sessionId) {
                await mobileAuthService_1.mobileAuthService.invalidateSession(sessionId);
            }
            res.json({ message: 'Logged out successfully' });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    }
    // Send verification code
    static async sendVerification(req, res) {
        try {
            const userId = req.user?.id;
            const { type } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            await mobileAuthService_1.mobileAuthService.sendVerificationCode(userId, type);
            res.json({
                message: `Verification code sent to ${type}`,
                type
            });
        }
        catch (error) {
            console.error('Send verification error:', error);
            res.status(500).json({ error: 'Failed to send verification code' });
        }
    }
    // Verify code
    static async verifyCode(req, res) {
        try {
            const userId = req.user?.id;
            const { code, type } = req.body;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const isValid = await mobileAuthService_1.mobileAuthService.verifyCode(userId, code, type);
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
        }
        catch (error) {
            console.error('Verification error:', error);
            res.status(500).json({ error: 'Verification failed' });
        }
    }
    // Password reset request
    static async passwordResetRequest(req, res) {
        try {
            const { email } = req.body;
            // Check if user exists
            const userExists = await mobileAuthService_1.mobileAuthService.checkUserExists(email);
            if (!userExists) {
                // Don't reveal if user exists or not for security
                return res.json({
                    message: 'If the email exists, a reset link has been sent'
                });
            }
            // Generate reset token and send email
            const resetToken = await mobileAuthService_1.mobileAuthService.generatePasswordResetToken(email);
            // Here you would send email with reset link
            console.log(`Password reset token for ${email}: ${resetToken}`);
            res.json({
                message: 'If the email exists, a reset link has been sent'
            });
        }
        catch (error) {
            console.error('Password reset request error:', error);
            res.status(500).json({ error: 'Password reset request failed' });
        }
    }
    // Password reset confirm
    static async passwordResetConfirm(req, res) {
        try {
            const { token, new_password } = req.body;
            const success = await mobileAuthService_1.mobileAuthService.resetPassword(token, new_password);
            if (!success) {
                return res.status(400).json({
                    error: 'Invalid or expired reset token',
                    code: 'INVALID_RESET_TOKEN'
                });
            }
            res.json({
                message: 'Password reset successfully'
            });
        }
        catch (error) {
            console.error('Password reset confirm error:', error);
            res.status(500).json({ error: 'Password reset failed' });
        }
    }
    // Get current user profile
    static async getProfile(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            res.json({ user });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }
}
exports.MobileAuthController = MobileAuthController;
