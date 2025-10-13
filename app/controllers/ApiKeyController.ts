import { Request, Response } from 'express';
import { AuthQueries } from '../queries/authQueries';
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest, ApiKeyType } from '../models/ApiKey';
import crypto from 'crypto';

export class ApiKeyController {
  static async getAllApiKeys(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const apiKeys = await AuthQueries.getAllApiKeys(limit, offset);
      res.json({
        api_keys: apiKeys,
        pagination: {
          limit,
          offset,
          count: apiKeys.length
        }
      });
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getApiKeysByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const apiKeys = await AuthQueries.getUserApiKeys(parseInt(userId));
      res.json(apiKeys);
    } catch (error) {
      console.error('Error fetching user API keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createApiKey(req: Request, res: Response) {
    try {
      const { user_id, type, name, description, expires_at }: CreateApiKeyRequest = req.body;

      // Generate unique key with vb_ prefix and secret
      const keySuffix = crypto.randomBytes(24).toString('hex'); // 48 chars instead of 64 to account for prefix
      const key = `vb_${keySuffix}`;
      const secret = crypto.randomBytes(64).toString('hex');

      const apiKey = await AuthQueries.createApiKey(user_id, key, secret, type, name, description, expires_at ? new Date(expires_at) : undefined);

      // Return key and secret only on creation (secret is hashed in DB)
      res.status(201).json({
        id: apiKey.id,
        user_id: apiKey.user_id,
        key: apiKey.key,
        secret: secret, // Return the secret only once
        type: apiKey.type,
        name: apiKey.name,
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

      const updatedApiKey = await AuthQueries.updateApiKey(parseInt(id), description, expires_at);

      if (!updatedApiKey) {
        return res.status(404).json({ error: 'API key not found' });
      }

      res.json(updatedApiKey);
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteApiKey(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const deletedApiKey = await AuthQueries.deleteApiKey(parseInt(id));

      if (!deletedApiKey) {
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

      const apiKey = await AuthQueries.getApiKey(key, secret);

      if (!apiKey) {
        return res.status(401).json({ error: 'Invalid or expired API key' });
      }

      res.json({
        valid: true,
        user_id: apiKey.user_id,
        expires_at: apiKey.expires_at
      });
    } catch (error) {
      console.error('Error validating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}