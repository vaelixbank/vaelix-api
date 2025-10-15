import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { OAuth2Service } from '../services/oauth2Service';
import { MFAService } from '../services/mfaService';

export class OAuth2Controller {
  /**
   * OAuth 2.0 Authorization Endpoint (RFC 6749)
   */
  async authorize(req: Request, res: Response) {
    try {
      const {
        response_type,
        client_id,
        redirect_uri,
        scope = 'read',
        state,
        code_challenge,
        code_challenge_method = 'S256'
      } = req.query as any;

      // Validate required parameters
      if (!response_type || !client_id || !redirect_uri) {
        return res.status(400).json({
          error: 'invalid_request',
          error_description: 'Missing required parameters'
        });
      }

      if (response_type !== 'code') {
        return res.status(400).json({
          error: 'unsupported_response_type',
          error_description: 'Only authorization code flow is supported'
        });
      }

      // Validate client
      const isValidClient = await OAuth2Service.validateClient(client_id, '');
      if (!isValidClient) {
        return res.status(400).json({
          error: 'invalid_client',
          error_description: 'Invalid client_id'
        });
      }

      // In production, redirect to login page
      // For demo, generate authorization code directly
      const authCode = OAuth2Service.generateAuthorizationCode({
        client_id,
        redirect_uri,
        scope,
        code_challenge,
        code_challenge_method,
        user_id: 1 // Mock user ID
      });

      // Store authorization code (in production, use database)
      // For demo, we'll handle it in token endpoint

      const redirectUrl = new URL(redirect_uri);
      redirectUrl.searchParams.set('code', authCode.code);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('OAuth2 authorization failed', { error: error.message });
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  /**
   * OAuth 2.0 Token Endpoint (RFC 6749)
   */
  async token(req: Request, res: Response) {
    try {
      const {
        grant_type,
        code,
        redirect_uri,
        client_id,
        client_secret,
        code_verifier
      } = req.body;

      if (grant_type !== 'authorization_code') {
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code grant type is supported'
        });
      }

      // Validate client credentials
      const isValidClient = await OAuth2Service.validateClient(client_id, client_secret);
      if (!isValidClient) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        });
      }

      // Validate authorization code
      const isValidCode = OAuth2Service.validateAuthorizationCode(
        code,
        code_verifier,
        client_id,
        redirect_uri
      );

      if (!isValidCode) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        });
      }

      // Generate tokens
      const tokens = OAuth2Service.generateAccessToken(1, client_id, 'read'); // Mock user ID

      res.json({
        access_token: tokens.access_token,
        token_type: tokens.token_type,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope
      });
    } catch (error: any) {
      logger.error('OAuth2 token exchange failed', { error: error.message });
      res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      });
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(req: Request, res: Response) {
    try {
      const { user_id, type = 'totp' } = req.body;

      if (!user_id) {
        return ApiResponseHandler.error(res, 'user_id is required', 'VALIDATION_ERROR', 400);
      }

      let secret;
      let uri;

      if (type === 'totp') {
        secret = MFAService.generateTOTPSecret('Vaelix Bank', `user-${user_id}`);
        uri = MFAService.generateTOTPURI(secret);
      } else if (type === 'hotp') {
        secret = MFAService.generateHOTPSecret('Vaelix Bank', `user-${user_id}`);
        uri = MFAService.generateHOTPURI(secret);
      } else {
        return ApiResponseHandler.error(res, 'Invalid MFA type. Use "totp" or "hotp"', 'VALIDATION_ERROR', 400);
      }

      // Generate backup codes
      const backupCodes = MFAService.generateBackupCodes();

      // In production, store secret and backup codes securely in database

      return ApiResponseHandler.success(res, {
        type,
        secret: secret.secret,
        uri,
        backup_codes: backupCodes,
        setup_instructions: 'Scan the QR code with your authenticator app or manually enter the secret key.'
      });
    } catch (error: any) {
      logger.error('MFA setup failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(req: Request, res: Response) {
    try {
      const { user_id, code, type = 'totp', secret } = req.body;

      if (!user_id || !code) {
        return ApiResponseHandler.error(res, 'user_id and code are required', 'VALIDATION_ERROR', 400);
      }

      let isValid = false;

      if (type === 'totp') {
        isValid = MFAService.verifyTOTP(secret, code);
      } else if (type === 'hotp') {
        // For HOTP, we'd need to track counter in database
        const result = MFAService.verifyHOTP(secret, code, 0); // Mock counter
        isValid = result.valid;
      } else {
        return ApiResponseHandler.error(res, 'Invalid MFA type', 'VALIDATION_ERROR', 400);
      }

      if (isValid) {
        return ApiResponseHandler.success(res, {
          verified: true,
          message: 'MFA code verified successfully'
        });
      } else {
        return ApiResponseHandler.error(res, 'Invalid MFA code', 'AUTHENTICATION_FAILED', 401);
      }
    } catch (error: any) {
      logger.error('MFA verification failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Validate access token
   */
  async validateToken(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ApiResponseHandler.error(res, 'Bearer token required', 'MISSING_TOKEN', 401);
      }

      const token = authHeader.substring(7);
      const validation = OAuth2Service.validateAccessToken(token);

      if (validation.valid) {
        return ApiResponseHandler.success(res, {
          valid: true,
          payload: validation.payload
        });
      } else {
        return ApiResponseHandler.error(res, 'Invalid or expired token', 'INVALID_TOKEN', 401);
      }
    } catch (error: any) {
      logger.error('Token validation failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
}

export const oauth2Controller = new OAuth2Controller();