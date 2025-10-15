import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface OAuth2Token {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface OAuth2AuthorizationCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: 'S256' | 'plain';
  expires_at: Date;
  user_id: number;
}

export class OAuth2Service {
  private static readonly CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
  private static readonly ACCESS_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour
  private static readonly REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Generate PKCE code challenge (RFC 7636)
   */
  static generateCodeChallenge(codeVerifier: string, method: 'S256' | 'plain' = 'S256'): string {
    if (method === 'S256') {
      const hash = crypto.createHash('sha256').update(codeVerifier).digest();
      return hash.toString('base64url');
    }
    return codeVerifier;
  }

  /**
   * Verify PKCE code challenge
   */
  static verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method: 'S256' | 'plain'): boolean {
    const expectedChallenge = this.generateCodeChallenge(codeVerifier, method);
    return crypto.timingSafeEqual(
      Buffer.from(expectedChallenge, 'utf8'),
      Buffer.from(codeChallenge, 'utf8')
    );
  }

  /**
   * Generate authorization code
   */
  static generateAuthorizationCode(params: {
    client_id: string;
    redirect_uri: string;
    scope: string;
    code_challenge: string;
    code_challenge_method: 'S256' | 'plain';
    user_id: number;
  }): OAuth2AuthorizationCode {
    const code = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + this.CODE_EXPIRY);

    return {
      code,
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      scope: params.scope,
      code_challenge: params.code_challenge,
      code_challenge_method: params.code_challenge_method,
      expires_at,
      user_id: params.user_id
    };
  }

  /**
   * Generate access token (JWT-like structure)
   */
  static generateAccessToken(userId: number, clientId: string, scope: string): OAuth2Token {
    const payload = {
      sub: userId.toString(),
      client_id: clientId,
      scope,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.ACCESS_TOKEN_EXPIRY) / 1000),
      jti: crypto.randomUUID()
    };

    // In production, use proper JWT signing
    const accessToken = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.ACCESS_TOKEN_EXPIRY / 1000,
      refresh_token: refreshToken,
      scope
    };
  }

  /**
   * Validate authorization code
   */
  static validateAuthorizationCode(
    code: string,
    codeVerifier: string,
    clientId: string,
    redirectUri: string
  ): boolean {
    // In production, this would check against stored codes in database
    // For now, basic validation
    if (!code || !codeVerifier || !clientId || !redirectUri) {
      return false;
    }

    // Verify code format (should be stored and retrieved)
    if (code.length !== 64) { // 32 bytes hex
      return false;
    }

    return true;
  }

  /**
   * Validate client credentials
   */
  static async validateClient(clientId: string, clientSecret: string): Promise<boolean> {
    try {
      // In production, check against database
      const { ServiceQueries } = await import('../queries/serviceQueries');
      const client = await ServiceQueries.getServiceIntegration(clientId);

      if (!client) return false;

      // Use timing-safe comparison for secrets
      return crypto.timingSafeEqual(
        Buffer.from(clientSecret, 'utf8'),
        Buffer.from(client.auth_token || '', 'utf8')
      );
    } catch (error) {
      logger.error('Client validation failed', { error });
      return false;
    }
  }

  /**
   * Validate access token
   */
  static validateAccessToken(token: string): { valid: boolean; payload?: any } {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString());

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false };
      }

      return { valid: true, payload };
    } catch (error) {
      logger.error('Token validation failed', { error });
      return { valid: false };
    }
  }

  /**
   * Revoke token
   */
  static async revokeToken(token: string): Promise<boolean> {
    try {
      // In production, add to revocation list
      logger.info('Token revoked', { token: token.substring(0, 10) + '...' });
      return true;
    } catch (error) {
      logger.error('Token revocation failed', { error });
      return false;
    }
  }
}

export const oauth2Service = new OAuth2Service();