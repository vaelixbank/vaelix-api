"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserQueries = void 0;
const database_1 = __importDefault(require("../utils/database"));
class UserQueries {
    // Insert new user
    static async createUser(email, full_name, phone, kyc_status) {
        const result = await database_1.default.query('INSERT INTO users (email, full_name, phone, kyc_status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id', [email, full_name, phone, kyc_status]);
        return result.rows[0];
    }
    // Update user
    static async updateUser(id, full_name, phone, kyc_status) {
        const result = await database_1.default.query('UPDATE users SET full_name = COALESCE($2, full_name), phone = COALESCE($3, phone), kyc_status = COALESCE($4, kyc_status), updated_at = NOW() WHERE id = $1 RETURNING *', [id, full_name, phone, kyc_status]);
        return result.rows[0];
    }
    // Select user by ID
    static async getUserById(id) {
        const result = await database_1.default.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Select user by email
    static async getUserByEmail(email) {
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }
    // Select all users
    static async getAllUsers() {
        const result = await database_1.default.query('SELECT * FROM users ORDER BY created_at DESC');
        return result.rows;
    }
    // Delete user
    static async deleteUser(id) {
        const result = await database_1.default.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
    // Insert user role
    static async assignUserRole(user_id, role_id) {
        const result = await database_1.default.query('INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, NOW())', [user_id, role_id]);
        return result.rows[0];
    }
    // Select user roles
    static async getUserRoles(user_id) {
        const result = await database_1.default.query('SELECT r.name FROM roles r JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1', [user_id]);
        return result.rows;
    }
    // Insert session
    static async createSession(user_id, session_token, expires_at) {
        const result = await database_1.default.query('INSERT INTO sessions (user_id, session_token, expires_at, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id', [user_id, session_token, expires_at]);
        return result.rows[0];
    }
    // Update session last activity
    static async updateSessionActivity(id) {
        await database_1.default.query('UPDATE sessions SET last_activity = NOW() WHERE id = $1', [id]);
    }
    // Delete expired sessions
    static async deleteExpiredSessions() {
        await database_1.default.query('DELETE FROM sessions WHERE expires_at < NOW()');
    }
    // Get active session
    static async getActiveSession(session_token) {
        const result = await database_1.default.query('SELECT s.*, u.email, u.full_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = $1 AND s.expires_at > NOW()', [session_token]);
        return result.rows[0];
    }
    // Insert login attempt
    static async createLoginAttempt(user_id, ip_address, success) {
        await database_1.default.query('INSERT INTO login_attempts (user_id, ip_address, success, attempted_at) VALUES ($1, $2, $3, NOW())', [user_id, ip_address, success]);
    }
    // Check login attempts (last 24 hours)
    static async getLoginAttemptsLast24h(user_id) {
        const result = await database_1.default.query('SELECT COUNT(*) as attempts FROM login_attempts WHERE user_id = $1 AND attempted_at > NOW() - INTERVAL \'24 hours\' AND success = false', [user_id]);
        return parseInt(result.rows[0].attempts);
    }
    // Insert consumer
    static async createConsumer(id, user_id, state, root_user, kyc) {
        const result = await database_1.default.query('INSERT INTO consumers (id, user_id, type, state, root_user, kyc, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [id, user_id, 'consumer', state, JSON.stringify(root_user), kyc ? JSON.stringify(kyc) : null]);
        return result.rows[0];
    }
    // Update consumer
    static async updateConsumer(id, state, kyc) {
        const result = await database_1.default.query('UPDATE consumers SET state = COALESCE($2, state), kyc = COALESCE($3, kyc), updated_at = NOW() WHERE id = $1 RETURNING *', [id, state, kyc ? JSON.stringify(kyc) : null]);
        return result.rows[0];
    }
    // Get consumer by ID
    static async getConsumerById(id) {
        const result = await database_1.default.query('SELECT * FROM consumers WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Insert corporate
    static async createCorporate(id, user_id, state, root_user, kyb, company) {
        const result = await database_1.default.query('INSERT INTO corporates (id, user_id, type, state, root_user, kyb, company, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())', [id, user_id, 'corporate', state, JSON.stringify(root_user), kyb ? JSON.stringify(kyb) : null, company ? JSON.stringify(company) : null]);
        return result.rows[0];
    }
    // Update corporate
    static async updateCorporate(id, state, kyb, company) {
        const result = await database_1.default.query('UPDATE corporates SET state = COALESCE($2, state), kyb = COALESCE($3, kyb), company = COALESCE($4, company), updated_at = NOW() WHERE id = $1 RETURNING *', [id, state, kyb ? JSON.stringify(kyb) : null, company ? JSON.stringify(company) : null]);
        return result.rows[0];
    }
    // Get corporate by ID
    static async getCorporateById(id) {
        const result = await database_1.default.query('SELECT * FROM corporates WHERE id = $1', [id]);
        return result.rows[0];
    }
    // =========================================
    // WEAVR SYNCHRONIZATION METHODS
    // =========================================
    // Update consumer with Weavr data
    static async updateConsumerWeavrData(id, weavrData) {
        const result = await database_1.default.query(`UPDATE consumers SET
        weavr_id = $2,
        last_weavr_sync = $3,
        sync_status = $4,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`, [
            id,
            weavrData.weavr_id || null,
            weavrData.last_weavr_sync || new Date(),
            weavrData.sync_status || 'synced'
        ]);
        return result.rows[0];
    }
    // Update consumer sync status
    static async updateConsumerSyncStatus(id, sync_status, error_message) {
        const result = await database_1.default.query('UPDATE consumers SET sync_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, sync_status]);
        return result.rows[0];
    }
    // Update corporate with Weavr data
    static async updateCorporateWeavrData(id, weavrData) {
        const result = await database_1.default.query(`UPDATE corporates SET
        weavr_id = $2,
        last_weavr_sync = $3,
        sync_status = $4,
        updated_at = NOW()
       WHERE id = $1 RETURNING *`, [
            id,
            weavrData.weavr_id || null,
            weavrData.last_weavr_sync || new Date(),
            weavrData.sync_status || 'synced'
        ]);
        return result.rows[0];
    }
    // Update corporate sync status
    static async updateCorporateSyncStatus(id, sync_status, error_message) {
        const result = await database_1.default.query('UPDATE corporates SET sync_status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, sync_status]);
        return result.rows[0];
    }
    // Get pending sync consumers
    static async getPendingSyncConsumers() {
        const result = await database_1.default.query("SELECT * FROM consumers WHERE sync_status IN ('pending', 'failed') ORDER BY created_at ASC");
        return result.rows;
    }
    // Get pending sync corporates
    static async getPendingSyncCorporates() {
        const result = await database_1.default.query("SELECT * FROM corporates WHERE sync_status IN ('pending', 'failed') ORDER BY created_at ASC");
        return result.rows;
    }
    // =========================================
    // MOBILE AUTH METHODS
    // =========================================
    // Create user with password hash for mobile auth
    static async createUserWithPassword(email, full_name, phone, password_hash, device_id) {
        const result = await database_1.default.query(`INSERT INTO users (email, full_name, phone, password_hash, device_id, is_verified, kyc_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, false, 'pending', NOW(), NOW())
       RETURNING id, email, phone, full_name, device_id, is_verified, kyc_status, created_at`, [email, full_name, phone, password_hash, device_id]);
        return result.rows[0];
    }
    // Update user password
    static async updateUserPassword(id, password_hash) {
        const result = await database_1.default.query('UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, password_hash]);
        return result.rows[0];
    }
    // Update user device and last login
    static async updateUserDeviceAndLogin(id, device_id) {
        const result = await database_1.default.query('UPDATE users SET device_id = $2, last_login = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *', [id, device_id]);
        return result.rows[0];
    }
    // Mark user as verified
    static async markUserAsVerified(id) {
        const result = await database_1.default.query('UPDATE users SET is_verified = true, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
    // Get user by email with password hash
    static async getUserByEmailWithPassword(email) {
        const result = await database_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0];
    }
}
exports.UserQueries = UserQueries;
