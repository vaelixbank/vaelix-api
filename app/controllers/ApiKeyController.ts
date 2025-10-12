import { Request, Response } from 'express';
import { AuthQueries } from '../queries/authQueries';
import { ApiKey, CreateApiKeyRequest, UpdateApiKeyRequest, ApiKeyType } from '../models/ApiKey';
import crypto from 'crypto';

export class ApiKeyController {
  static async getAllApiKeys(req: Request, res: Response) {
    try {
      // This would need a separate query in AuthQueries for admin access
      res.status(501).json({ error: 'Not implemented yet' });
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
      const { user_id, description }: CreateApiKeyRequest = req.body;

      // Generate unique key and secret
      const key = crypto.randomBytes(32).toString('hex');
      const secret = crypto.randomBytes(64).toString('hex');

      const apiKey = await AuthQueries.createApiKey(user_id, key, secret, description);

      // Return key and secret only on creation (don't store secret in DB for security)
      res.status(201).json({
        id: apiKey.id,
        user_id: apiKey.user_id,
        key: apiKey.key,
        secret: secret, // Return the secret only once
        description: apiKey.description,
        created_at: apiKey.created_at
      });
    } catch (error: any) {
      console.error('Error creating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateApiKey(req: Request, res: Response) {
    try {
      // TODO: Implement update API key in AuthQueries
      res.status(501).json({ error: 'Not implemented yet' });
    } catch (error) {
      console.error('Error updating API key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteApiKey(req: Request, res: Response) {
    try {
      // TODO: Implement delete API key in AuthQueries
      res.status(501).json({ error: 'Not implemented yet' });
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