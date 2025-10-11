import { Request, Response } from 'express';
import pool from '../utils/database';
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest, ApiKeyType } from '../models/ApiKey';
import crypto from 'crypto';

export class ApiKeyController {
  static async getAllApiKeys(req: Request, res: Response) {
    try {
      const result = await pool.query('SELECT * FROM api_keys ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getApiKeysByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const result = await pool.query('SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching user API keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createApiKey(req: Request, res: Response) {
    try {
      const { user_id, type, description, expires_at }: CreateApiKeyRequest = req.body;

      // Generate unique key and secret
      const key = crypto.randomBytes(32).toString('hex');
      const secret = crypto.randomBytes(64).toString('hex');

      const result = await pool.query(
        'INSERT INTO api_keys (user_id, key, secret, type, description, expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [user_id, key, secret, type, description, expires_at]
      );

      // Return key and secret only on creation (don't store secret in DB for security)
      const apiKey = result.rows[0];
      res.status(201).json({
        id: apiKey.id,
        user_id: apiKey.user_id,
        key: apiKey.key,
        secret: secret, // Return the secret only once
        type: apiKey.type,
        description: apiKey.description,
        expires_at: apiKey.expires_at,
        created_at: apiKey.created_at
      });
    } catch (error: any) {
      console.error('Error creating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateApiKey(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { description, expires_at }: UpdateApiKeyRequest = req.body;

      const result = await pool.query(
        'UPDATE api_keys SET description = COALESCE($1, description), expires_at = COALESCE($2, expires_at) WHERE id = $3 RETURNING *',
        [description, expires_at, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'API key not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteApiKey(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pool.query('DELETE FROM api_keys WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'API key not found' });
      }

      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      console.error('Error deleting API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async validateApiKey(req: Request, res: Response) {
    try {
      const { key, secret } = req.body;

      const result = await pool.query(
        'SELECT * FROM api_keys WHERE key = $1 AND secret = $2 AND (expires_at IS NULL OR expires_at > NOW())',
        [key, secret]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }

      const apiKey = result.rows[0];
      res.json({
        valid: true,
        type: apiKey.type,
        user_id: apiKey.user_id,
        expires_at: apiKey.expires_at
      });
    } catch (error) {
      console.error('Error validating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}