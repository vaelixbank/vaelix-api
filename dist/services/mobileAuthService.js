"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mobileAuthService = exports.MobileAuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const userQueries_1 = require("../queries/userQueries");
const authQueries_1 = require("../queries/authQueries");
class MobileAuthService {
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
        this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    }
    // Hash password
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, 12);
    }
    // Verify password
    async verifyPassword(password, hash) {
        return bcrypt_1.default.compare(password, hash);
    }
    // Generate tokens
    generateTokens(user) {
        const access_token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            type: 'access'
        }, this.jwtSecret, { expiresIn: this.accessTokenExpiry });
        const refresh_token = jsonwebtoken_1.default.sign({
            userId: user.id,
            type: 'refresh'
        }, this.jwtRefreshSecret, { expiresIn: this.refreshTokenExpiry });
        return {
            access_token,
            refresh_token,
            token_type: 'Bearer',
            expires_in: 15 * 60, // 15 minutes in seconds
            user
        };
    }
    // Verify access token
    async verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            if (decoded.type !== 'access') {
                return null;
            }
            // Get user from database
            const user = await userQueries_1.UserQueries.getUserById(decoded.userId);
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
            };
        }
        catch (error) {
            return null;
        }
    }
    // Verify refresh token
    async verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtRefreshSecret);
            if (decoded.type !== 'refresh') {
                return null;
            }
            return decoded.userId;
        }
        catch (error) {
            return null;
        }
    }
    // Create session
    async createSession(userId, deviceId, tokens) {
        return await authQueries_1.AuthQueries.createMobileSession(userId, deviceId, tokens.access_token, tokens.refresh_token);
    }
    // Get active session
    async getActiveSession(sessionId) {
        return await authQueries_1.AuthQueries.getActiveSessionById(sessionId);
    }
    // Update session activity
    async updateSessionActivity(sessionId) {
        await authQueries_1.AuthQueries.updateSessionActivity(sessionId);
    }
    // Invalidate session
    async invalidateSession(sessionId) {
        await authQueries_1.AuthQueries.invalidateSession(sessionId);
    }
    // Invalidate all user sessions
    async invalidateAllUserSessions(userId) {
        await authQueries_1.AuthQueries.invalidateAllUserSessions(userId);
    }
    // Register new user
    async register(data) {
        const hashedPassword = await this.hashPassword(data.password);
        return await userQueries_1.UserQueries.createUserWithPassword(data.email, data.full_name, data.phone, hashedPassword, data.device_id);
    }
    // Login user
    async login(data) {
        // Find user by email
        const user = await userQueries_1.UserQueries.getUserByEmailWithPassword(data.email);
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
        await userQueries_1.UserQueries.updateUserDeviceAndLogin(user.id, data.device_id);
        // Create user object without password
        const mobileUser = {
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
    async refreshTokens(refreshToken) {
        const userId = await this.verifyRefreshToken(refreshToken);
        if (!userId) {
            return null;
        }
        // Get user
        const user = await userQueries_1.UserQueries.getUserById(userId);
        if (!user) {
            return null;
        }
        const mobileUser = {
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
    async sendVerificationCode(userId, type) {
        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Store verification code
        await authQueries_1.AuthQueries.createVerificationCode(userId, code, type);
        // Here you would integrate with SMS/email service
        // For now, just return the code (in production, send via service)
        console.log(`Verification code for ${type}: ${code}`);
        return code;
    }
    // Verify code
    async verifyCode(userId, code, type) {
        const verificationCode = await authQueries_1.AuthQueries.getVerificationCode(userId, code, type);
        if (verificationCode) {
            // Mark user as verified
            await userQueries_1.UserQueries.markUserAsVerified(userId);
            // Clean up verification code
            await authQueries_1.AuthQueries.deleteVerificationCode(userId, type);
            return true;
        }
        return false;
    }
    // Check if user exists
    async checkUserExists(email) {
        const user = await userQueries_1.UserQueries.getUserByEmail(email);
        return !!user;
    }
    // Generate password reset token
    async generatePasswordResetToken(email) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        await authQueries_1.AuthQueries.createPasswordResetToken(email, token);
        return token;
    }
    // Reset password
    async resetPassword(token, newPassword) {
        const resetToken = await authQueries_1.AuthQueries.getPasswordResetToken(token);
        if (!resetToken) {
            return false;
        }
        const hashedPassword = await this.hashPassword(newPassword);
        // Update password - need to get user by email first
        const user = await userQueries_1.UserQueries.getUserByEmail(resetToken.email);
        if (!user) {
            return false;
        }
        await userQueries_1.UserQueries.updateUserPassword(user.id, hashedPassword);
        // Clean up token
        await authQueries_1.AuthQueries.deletePasswordResetToken(token);
        return true;
    }
}
exports.MobileAuthService = MobileAuthService;
exports.mobileAuthService = new MobileAuthService();
