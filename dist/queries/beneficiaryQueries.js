"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiaryQueries = void 0;
const database_1 = __importDefault(require("../utils/database"));
class BeneficiaryQueries {
    // Insert beneficiary
    static async createBeneficiary(id, profile_id, name, type, state, details) {
        const result = await database_1.default.query('INSERT INTO beneficiaries (id, profile_id, name, type, state, details, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())', [id, profile_id, name, type, state, JSON.stringify(details)]);
        return result.rows[0];
    }
    // Update beneficiary
    static async updateBeneficiary(id, name, state, details) {
        const result = await database_1.default.query('UPDATE beneficiaries SET name = COALESCE($2, name), state = COALESCE($3, state), details = COALESCE($4, details), updated_at = NOW() WHERE id = $1 RETURNING *', [id, name, state, details ? JSON.stringify(details) : null]);
        return result.rows[0];
    }
    // Select beneficiaries by profile
    static async getBeneficiariesByProfile(profile_id) {
        const result = await database_1.default.query('SELECT * FROM beneficiaries WHERE profile_id = $1', [profile_id]);
        return result.rows;
    }
    // Get beneficiary by ID
    static async getBeneficiaryById(id) {
        const result = await database_1.default.query('SELECT * FROM beneficiaries WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Insert beneficiary batch
    static async createBeneficiaryBatch(id, profile_id, state, beneficiaries) {
        const result = await database_1.default.query('INSERT INTO beneficiary_batches (id, profile_id, state, beneficiaries, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())', [id, profile_id, state, JSON.stringify(beneficiaries)]);
        return result.rows[0];
    }
    // Update batch state
    static async updateBeneficiaryBatchState(id, state) {
        const result = await database_1.default.query('UPDATE beneficiary_batches SET state = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, state]);
        return result.rows[0];
    }
    // Get beneficiary batch by ID
    static async getBeneficiaryBatchById(id) {
        const result = await database_1.default.query('SELECT * FROM beneficiary_batches WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Insert bulk process
    static async createBulkProcess(id, type, state, progress) {
        const result = await database_1.default.query('INSERT INTO bulk_processes (id, type, state, progress, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id', [id, type, state, JSON.stringify(progress)]);
        return result.rows[0];
    }
    // Update bulk process
    static async updateBulkProcess(id, state, progress) {
        const result = await database_1.default.query(`UPDATE bulk_processes SET state = $2, progress = $3,
       started_at = CASE WHEN $2 = 'running' AND started_at IS NULL THEN NOW() ELSE started_at END,
       completed_at = CASE WHEN $2 = 'completed' THEN NOW() ELSE completed_at END,
       paused_at = CASE WHEN $2 = 'paused' THEN NOW() ELSE paused_at END,
       cancelled_at = CASE WHEN $2 = 'cancelled' THEN NOW() ELSE cancelled_at END
       WHERE id = $1 RETURNING *`, [id, state, JSON.stringify(progress)]);
        return result.rows[0];
    }
    // Get bulk process by ID
    static async getBulkProcessById(id) {
        const result = await database_1.default.query('SELECT * FROM bulk_processes WHERE id = $1', [id]);
        return result.rows[0];
    }
    // Insert bulk operation
    static async createBulkOperation(id, bulk_id, type, state, data) {
        const result = await database_1.default.query('INSERT INTO bulk_operations (id, bulk_id, type, state, data, created_at) VALUES ($1, $2, $3, $4, $5, NOW())', [id, bulk_id, type, state, JSON.stringify(data)]);
        return result.rows[0];
    }
    // Update bulk operation
    static async updateBulkOperation(id, state, result, error) {
        const resultQuery = await database_1.default.query('UPDATE bulk_operations SET state = $2, result = $3, error = $4, completed_at = NOW() WHERE id = $1 RETURNING *', [id, state, result ? JSON.stringify(result) : null, error]);
        return resultQuery.rows[0];
    }
    // Get bulk operations by bulk_id
    static async getBulkOperations(bulk_id) {
        const result = await database_1.default.query('SELECT * FROM bulk_operations WHERE bulk_id = $1 ORDER BY created_at', [bulk_id]);
        return result.rows;
    }
    // Insert linked account
    static async createLinkedAccount(id, profile_id, name, state, type, currency, balance, bank_details) {
        const result = await database_1.default.query('INSERT INTO linked_accounts (id, profile_id, name, state, type, currency, balance, bank_details, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())', [id, profile_id, name, state, type, currency, JSON.stringify(balance), JSON.stringify(bank_details)]);
        return result.rows[0];
    }
    // Update linked account
    static async updateLinkedAccount(id, name, state, balance) {
        const result = await database_1.default.query('UPDATE linked_accounts SET name = COALESCE($2, name), state = COALESCE($3, state), balance = COALESCE($4, balance), updated_at = NOW() WHERE id = $1 RETURNING *', [id, name, state, balance ? JSON.stringify(balance) : null]);
        return result.rows[0];
    }
    // Insert account identifier
    static async createAccountIdentifier(linked_account_id, type, identification) {
        const result = await database_1.default.query('INSERT INTO account_identifiers (linked_account_id, type, identification) VALUES ($1, $2, $3)', [linked_account_id, type, identification]);
        return result.rows[0];
    }
    // Select linked accounts by profile with identifiers
    static async getLinkedAccountsByProfile(profile_id) {
        const result = await database_1.default.query(`SELECT la.*, array_agg(ai.identification) as identifiers
       FROM linked_accounts la
       LEFT JOIN account_identifiers ai ON la.id = ai.linked_account_id
       WHERE la.profile_id = $1
       GROUP BY la.id`, [profile_id]);
        return result.rows;
    }
    // Get linked account by ID
    static async getLinkedAccountById(id) {
        const result = await database_1.default.query(`SELECT la.*, array_agg(ai.identification) as identifiers
       FROM linked_accounts la
       LEFT JOIN account_identifiers ai ON la.id = ai.linked_account_id
       WHERE la.id = $1
       GROUP BY la.id`, [id]);
        return result.rows[0];
    }
}
exports.BeneficiaryQueries = BeneficiaryQueries;
