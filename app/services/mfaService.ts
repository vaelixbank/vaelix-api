import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface TOTPSecret {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number;
  issuer: string;
  account: string;
}

export interface HOTPSecret {
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  counter: number;
  issuer: string;
  account: string;
}

export class MFAService {
  private static readonly DEFAULT_TOTP_PERIOD = 30; // 30 seconds
  private static readonly DEFAULT_DIGITS = 6;
  private static readonly DEFAULT_ALGORITHM = 'SHA1';

  /**
   * Generate TOTP secret (RFC 6238)
   */
  static generateTOTPSecret(issuer: string, account: string): TOTPSecret {
    const secret = crypto.randomBytes(32).toString('base64').replace(/=/g, '');

    return {
      secret,
      algorithm: this.DEFAULT_ALGORITHM,
      digits: this.DEFAULT_DIGITS,
      period: this.DEFAULT_TOTP_PERIOD,
      issuer,
      account
    };
  }

  /**
   * Generate HOTP secret (RFC 4226)
   */
  static generateHOTPSecret(issuer: string, account: string): HOTPSecret {
    const secret = crypto.randomBytes(32).toString('base64').replace(/=/g, '');

    return {
      secret,
      algorithm: this.DEFAULT_ALGORITHM,
      digits: this.DEFAULT_DIGITS,
      counter: 0,
      issuer,
      account
    };
  }

  /**
   * Generate TOTP URI for QR code (Google Authenticator format)
   */
  static generateTOTPURI(totpSecret: TOTPSecret): string {
    const params = new URLSearchParams({
      secret: totpSecret.secret,
      issuer: totpSecret.issuer,
      algorithm: totpSecret.algorithm,
      digits: totpSecret.digits.toString(),
      period: totpSecret.period.toString()
    });

    return `otpauth://totp/${encodeURIComponent(totpSecret.issuer)}:${encodeURIComponent(totpSecret.account)}?${params}`;
  }

  /**
   * Generate HOTP URI for QR code
   */
  static generateHOTPURI(hotpSecret: HOTPSecret): string {
    const params = new URLSearchParams({
      secret: hotpSecret.secret,
      issuer: hotpSecret.issuer,
      algorithm: hotpSecret.algorithm,
      digits: hotpSecret.digits.toString(),
      counter: hotpSecret.counter.toString()
    });

    return `otpauth://hotp/${encodeURIComponent(hotpSecret.issuer)}:${encodeURIComponent(hotpSecret.account)}?${params}`;
  }

  /**
   * Generate TOTP code
   */
  static generateTOTP(secret: string, timeStep: number = 0, algorithm: string = 'SHA1', digits: number = 6, period: number = 30): string {
    const time = Math.floor((Date.now() / 1000 + timeStep) / period);
    return this.generateHOTP(secret, time, algorithm, digits);
  }

  /**
   * Generate HOTP code (RFC 4226)
   */
  static generateHOTP(secret: string, counter: number, algorithm: string = 'SHA1', digits: number = 6): string {
    // Decode base32 secret
    const key = this.base32Decode(secret);

    // Create HMAC
    const hmac = crypto.createHmac(algorithm.toLowerCase(), key);
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigUInt64BE(BigInt(counter), 0);
    hmac.update(counterBuffer);

    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);

    // Generate the final code
    const finalCode = code % Math.pow(10, digits);
    return finalCode.toString().padStart(digits, '0');
  }

  /**
   * Verify TOTP code
   */
  static verifyTOTP(secret: string, code: string, window: number = 1, algorithm: string = 'SHA1', digits: number = 6, period: number = 30): boolean {
    // Check current time and adjacent windows
    for (let i = -window; i <= window; i++) {
      const expectedCode = this.generateTOTP(secret, i, algorithm, digits, period);
      if (crypto.timingSafeEqual(Buffer.from(code, 'utf8'), Buffer.from(expectedCode, 'utf8'))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Verify HOTP code and increment counter
   */
  static verifyHOTP(secret: string, code: string, counter: number, algorithm: string = 'SHA1', digits: number = 6): { valid: boolean; newCounter: number } {
    const expectedCode = this.generateHOTP(secret, counter, algorithm, digits);

    if (crypto.timingSafeEqual(Buffer.from(code, 'utf8'), Buffer.from(expectedCode, 'utf8'))) {
      return { valid: true, newCounter: counter + 1 };
    }

    return { valid: false, newCounter: counter };
  }

  /**
   * Base32 decode (RFC 4648)
   */
  private static base32Decode(encoded: string): Buffer {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = Buffer.alloc(Math.floor(encoded.length * 5 / 8));

    for (let i = 0; i < encoded.length; i++) {
      const char = encoded.charAt(i).toUpperCase();
      const charIndex = alphabet.indexOf(char);

      if (charIndex === -1) continue; // Skip invalid characters

      value = (value << 5) | charIndex;
      bits += 5;

      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 0xff;
        bits -= 8;
      }
    }

    return output.slice(0, index);
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(code: string, storedCodes: string[]): { valid: boolean; remainingCodes: string[] } {
    const index = storedCodes.indexOf(code.toUpperCase());
    if (index === -1) {
      return { valid: false, remainingCodes: storedCodes };
    }

    // Remove used code
    const remainingCodes = [...storedCodes];
    remainingCodes.splice(index, 1);

    return { valid: true, remainingCodes };
  }
}

export const mfaService = new MFAService();