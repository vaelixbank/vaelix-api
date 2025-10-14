import { Request, Response } from 'express';
import pool from '../utils/database';
import { logger } from '../utils/logger';
import { ApiResponseHandler } from '../utils/response';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AdminController {
  // Admin login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return ApiResponseHandler.badRequest(res, 'Email and password are required');
      }

      // For demo purposes, we'll use a simple admin user
      // In production, this should be stored in database with proper roles
      const adminEmail = 'admin@vaelixbank.com';
      const adminPassword = 'Admin123!';

      if (email !== adminEmail) {
        return ApiResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, await bcrypt.hash(adminPassword, 10));
      if (!isValidPassword && password !== adminPassword) {
        return ApiResponseHandler.unauthorized(res, 'Invalid credentials');
      }

      // Generate JWT token
      const token = jwt.sign(
        { email: adminEmail, role: 'admin' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const user = {
        id: 1,
        email: adminEmail,
        full_name: 'Admin User',
        role: 'admin',
        is_verified: true
      };

      return ApiResponseHandler.success(res, { token, user });
    } catch (error) {
      logger.error('Admin login error:', error);
      return ApiResponseHandler.internalServerError(res, 'Login failed');
    }
  }

  // Get current admin user
  static async getCurrentUser(req: Request, res: Response) {
    try {
      // In a real implementation, you'd get this from the JWT token
      const user = {
        id: 1,
        email: 'admin@vaelixbank.com',
        full_name: 'Admin User',
        phone: '+1234567890',
        kyc_status: 'verified',
        is_verified: true,
        last_login: new Date().toISOString(),
        created_at: new Date().toISOString(),
        roles: ['admin']
      };

      return ApiResponseHandler.success(res, user);
    } catch (error) {
      logger.error('Get current user error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get user data');
    }
  }

  // Get dashboard stats
  static async getDashboardStats(req: Request, res: Response) {
    try {
      // Get real stats from database
      const userResult = await pool.query('SELECT COUNT(*) as count FROM users');
      const accountResult = await pool.query('SELECT COUNT(*) as count FROM accounts');
      const transactionResult = await pool.query('SELECT COUNT(*) as count FROM transactions');
      const balanceResult = await pool.query('SELECT COALESCE(SUM(balance), 0) as total FROM accounts');
      const pendingKycResult = await pool.query("SELECT COUNT(*) as count FROM users WHERE kyc_status = 'pending'");
      const amlResult = await pool.query('SELECT COUNT(*) as count FROM aml_flags WHERE resolved_at IS NULL');
      const apiKeyResult = await pool.query('SELECT COUNT(*) as count FROM api_keys WHERE expires_at > NOW()');

      // Get recent transactions
      const recentTransactions = await pool.query(`
        SELECT
          t.id,
          t.amount,
          t.currency,
          t.type,
          t.status,
          t.created_at,
          JSON_BUILD_OBJECT(
            'account_number', a.account_number,
            'user', JSON_BUILD_OBJECT('full_name', u.full_name)
          ) as account
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN users u ON a.user_id = u.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      const stats = {
        totalUsers: userResult.rows[0].count || 0,
        totalAccounts: accountResult.rows[0].count || 0,
        totalTransactions: transactionResult.rows[0].count || 0,
        totalBalance: balanceResult.rows[0].total || 0,
        pendingKyc: pendingKycResult.rows[0].count || 0,
        amlFlags: amlResult.rows[0].count || 0,
        activeApiKeys: apiKeyResult.rows[0].count || 0,
        recentTransactions: recentTransactions || []
      };

      return ApiResponseHandler.success(res, stats);
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get dashboard stats');
    }
  }

  // Get users with pagination and filters
  static async getUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search, kyc_status, is_verified } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (full_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (kyc_status) {
        whereClause += ` AND kyc_status = $${paramIndex}`;
        params.push(kyc_status);
        paramIndex++;
      }

      if (is_verified !== undefined) {
        whereClause += ` AND is_verified = $${paramIndex}`;
        params.push(is_verified === 'true');
        paramIndex++;
      }

      const users = await pool.query(`
        SELECT id, email, full_name, phone, kyc_status, is_verified, last_login, created_at
        FROM users
        WHERE ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, Number(limit), offset]);

      const totalResult = await pool.query(`
        SELECT COUNT(*) as count FROM users WHERE ${whereClause}
      `, params);

      const total = totalResult.rows[0].count;
      const totalPages = Math.ceil(total / Number(limit));

      return ApiResponseHandler.success(res, {
        data: users.rows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      });
    } catch (error) {
      logger.error('Get users error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get users');
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const users = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

      if (users.rows.length === 0) {
        return ApiResponseHandler.notFound(res, 'User not found');
      }

      return ApiResponseHandler.success(res, users.rows[0]);
    } catch (error) {
      logger.error('Get user by ID error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get user');
    }
  }

  // Get accounts with pagination
  static async getAccounts(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, user_id, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (user_id) {
        whereClause += ` AND user_id = $${paramIndex}`;
        params.push(user_id);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const accounts = await pool.query(`
        SELECT
          a.*,
          JSON_BUILD_OBJECT('email', u.email, 'full_name', u.full_name) as user
        FROM accounts a
        JOIN users u ON a.user_id = u.id
        WHERE ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, Number(limit), offset]);

      const totalResult = await pool.query(`
        SELECT COUNT(*) as count FROM accounts a WHERE ${whereClause}
      `, params);

      const total = totalResult.rows[0].count;
      const totalPages = Math.ceil(total / Number(limit));

      return ApiResponseHandler.success(res, {
        data: accounts,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      });
    } catch (error) {
      logger.error('Get accounts error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get accounts');
    }
  }

  // Get transactions with pagination and filters
  static async getTransactions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, account_id, type, status, date_from, date_to } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = '1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (account_id) {
        whereClause += ` AND t.account_id = $${paramIndex}`;
        params.push(account_id);
        paramIndex++;
      }

      if (type) {
        whereClause += ` AND t.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND t.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (date_from) {
        whereClause += ` AND t.created_at >= $${paramIndex}`;
        params.push(date_from);
        paramIndex++;
      }

      if (date_to) {
        whereClause += ` AND t.created_at <= $${paramIndex}`;
        params.push(date_to);
        paramIndex++;
      }

      const transactions = await pool.query(`
        SELECT
          t.id, t.amount, t.currency, t.type, t.status, t.description, t.created_at,
          JSON_BUILD_OBJECT(
            'account_number', a.account_number,
            'user', JSON_BUILD_OBJECT('full_name', u.full_name)
          ) as account
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN users u ON a.user_id = u.id
        WHERE ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, Number(limit), offset]);

      const totalResult = await pool.query(`
        SELECT COUNT(*) as count FROM transactions t WHERE ${whereClause}
      `, params);

      const total = totalResult.rows[0].count;
      const totalPages = Math.ceil(total / Number(limit));

      return ApiResponseHandler.success(res, {
        data: transactions,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      });
    } catch (error) {
      logger.error('Get transactions error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get transactions');
    }
  }

  // Get API keys
  static async getApiKeys(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const apiKeys = await pool.query(`
        SELECT
          ak.*,
          JSON_BUILD_OBJECT('email', u.email, 'full_name', u.full_name) as user
        FROM api_keys ak
        JOIN users u ON ak.user_id = u.id
        ORDER BY ak.created_at DESC
        LIMIT $1 OFFSET $2
      `, [Number(limit), offset]);

      const totalResult = await pool.query('SELECT COUNT(*) as count FROM api_keys');
      const total = totalResult.rows[0].count;
      const totalPages = Math.ceil(total / Number(limit));

      return ApiResponseHandler.success(res, {
        data: apiKeys,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      });
    } catch (error) {
      logger.error('Get API keys error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get API keys');
    }
  }

  // Get AML flags
  static async getAmlFlags(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const amlFlags = await pool.query(`
        SELECT
          af.*,
          JSON_BUILD_OBJECT('email', u.email, 'full_name', u.full_name) as user
        FROM aml_flags af
        JOIN users u ON af.user_id = u.id
        ORDER BY af.flagged_at DESC
        LIMIT $1 OFFSET $2
      `, [Number(limit), offset]);

      const totalResult = await pool.query('SELECT COUNT(*) as count FROM aml_flags');
      const total = totalResult.rows[0].count;
      const totalPages = Math.ceil(total / Number(limit));

      return ApiResponseHandler.success(res, {
        data: amlFlags,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages
      });
    } catch (error) {
      logger.error('Get AML flags error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get AML flags');
    }
  }

  // Get API metrics (simplified for demo)
  static async getApiMetrics(req: Request, res: Response) {
    try {
      // In a real implementation, you'd collect metrics from logs or monitoring system
      const metrics = {
        totalRequests: 12543,
        successRate: 0.987,
        averageResponseTime: 245,
        errorRate: 0.013,
        topEndpoints: [
          { endpoint: '/api/accounts', requests: 3241, avgResponseTime: 180 },
          { endpoint: '/api/transactions', requests: 2890, avgResponseTime: 220 },
          { endpoint: '/api/users', requests: 2156, avgResponseTime: 190 },
          { endpoint: '/api/auth/login', requests: 1834, avgResponseTime: 350 },
          { endpoint: '/api/cards', requests: 1422, avgResponseTime: 280 }
        ],
        recentErrors: [
          { timestamp: new Date().toISOString(), endpoint: '/api/transactions', error: 'Database timeout', statusCode: 500 },
          { timestamp: new Date(Date.now() - 3600000).toISOString(), endpoint: '/api/accounts', error: 'Invalid account ID', statusCode: 400 }
        ]
      };

      return ApiResponseHandler.success(res, metrics);
    } catch (error) {
      logger.error('Get API metrics error:', error);
      return ApiResponseHandler.internalServerError(res, 'Failed to get API metrics');
    }
  }
}