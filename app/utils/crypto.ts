// NASA Security Principle: Encryption at Rest - Protect sensitive data with strong encryption
// Uses AES-256-GCM for authenticated encryption, ensuring confidentiality and integrity

import crypto from 'crypto';

// Encryption configuration - NIST recommended parameters
const ALGORITHM = 'aes-256-gcm'; // Authenticated encryption with GCM mode
const IV_LENGTH = 16; // 128 bits for GCM nonce
const TAG_LENGTH = 16; // 128 bits authentication tag

// NASA Security Principle: Secure Key Management - Validate encryption key from environment
// Key must be 256 bits (32 bytes) in hex format for AES-256
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for data encryption');
  }
  if (key.length !== 64) { // 32 bytes in hex = 64 characters
    throw new Error('ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes) for AES-256');
  }
  return Buffer.from(key, 'hex');
};

// NASA Security Principle: Authenticated Encryption - Encrypt and authenticate data
// Uses AES-256-GCM with random IV and authentication tag for integrity
export const encrypt = (text: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH); // Unique IV for each encryption
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag(); // Authentication tag for integrity

  // Return format: iv:authTag:encryptedData (secure concatenation)
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

// NASA Security Principle: Secure Decryption - Verify integrity before decrypting
// Validates authentication tag to prevent tampering attacks
export const decrypt = (encryptedText: string): string => {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format - possible tampering');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag); // Set auth tag for verification

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8'); // Will throw if auth tag invalid

  return decrypted;
};

// NASA Security Principle: One-way Hashing - Protect sensitive data for indexing/searching
// Uses SHA-256 for secure hashing, preventing rainbow table attacks with salt if needed
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// NASA Security Principle: Cryptographically Secure Random - Generate secure tokens
// Uses crypto.randomBytes for high-entropy randomness, suitable for tokens/secrets
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};