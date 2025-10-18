// NASA Security Principle: Certificate-Based Authentication - Secure certificate validation and fingerprinting
// Implements X.509 certificate parsing, fingerprint calculation, and validation for mutual TLS

import crypto from 'crypto';
import { X509Certificate } from 'crypto';

export interface CertificateInfo {
  fingerprint: string;
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  isValid: boolean;
}

/**
 * Parse and validate an X.509 certificate
 * @param pemCertificate - PEM-encoded certificate
 * @returns CertificateInfo object with parsed details
 */
export const parseCertificate = (pemCertificate: string): CertificateInfo => {
  try {
    const cert = new X509Certificate(pemCertificate);

    // Calculate SHA-256 fingerprint
    const fingerprint = crypto.createHash('sha256')
      .update(cert.raw)
      .digest('hex')
      .toUpperCase()
      .replace(/(.{2})(?!$)/g, '$1:');

    // Check if certificate is currently valid
    const now = new Date();
    const validFrom = new Date(cert.validFrom);
    const validTo = new Date(cert.validTo);
    const isValid = now >= validFrom && now <= validTo;

    return {
      fingerprint,
      subject: cert.subject,
      issuer: cert.issuer,
      serialNumber: cert.serialNumber,
      validFrom,
      validTo,
      isValid
    };
  } catch (error: any) {
    throw new Error(`Invalid certificate: ${error.message}`);
  }
};

/**
 * Validate certificate against a Certificate Authority
 * @param certificate - PEM-encoded certificate
 * @param caCertificate - PEM-encoded CA certificate
 * @returns boolean indicating if certificate is valid and signed by CA
 */
export const validateCertificateChain = (certificate: string, caCertificate: string): boolean => {
  try {
    const cert = new X509Certificate(certificate);
    const caCert = new X509Certificate(caCertificate);

    // Check if certificate is signed by the CA
    // Note: In production, you might want to use a full certificate chain validation
    return cert.checkIssued(caCert);
  } catch (error) {
    console.error('Certificate chain validation failed:', error);
    return false;
  }
};

/**
 * Extract certificate information from Express request (for mutual TLS)
 * @param req - Express request object
 * @returns CertificateInfo if client certificate is present
 */
export const extractClientCertificate = (req: any): CertificateInfo | null => {
  // In mutual TLS, the client certificate is available in req.socket.getPeerCertificate()
  if (req.socket && typeof req.socket.getPeerCertificate === 'function') {
    try {
      const cert = req.socket.getPeerCertificate();
      if (cert && Object.keys(cert).length > 0 && cert.raw) {
        // Convert DER to PEM for parsing
        const pemCert = `-----BEGIN CERTIFICATE-----\n${cert.raw.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----`;
        return parseCertificate(pemCert);
      }
    } catch (error) {
      console.error('Error extracting client certificate:', error);
    }
  }
  return null;
};

/**
 * Check if a certificate fingerprint matches stored API key
 * @param certificateFingerprint - Fingerprint from client certificate
 * @param storedFingerprint - Fingerprint stored in database
 * @returns boolean indicating match
 */
export const validateCertificateFingerprint = (certificateFingerprint: string, storedFingerprint: string): boolean => {
  // Normalize fingerprints for comparison (remove colons and convert to uppercase)
  const normalizedCert = certificateFingerprint.replace(/:/g, '').toUpperCase();
  const normalizedStored = storedFingerprint.replace(/:/g, '').toUpperCase();

  // Ensure both fingerprints are the same length for timing-safe comparison
  if (normalizedCert.length !== normalizedStored.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(normalizedCert, 'hex'),
      Buffer.from(normalizedStored, 'hex')
    );
  } catch (error) {
    // If buffer creation fails, fall back to regular comparison
    return normalizedCert === normalizedStored;
  }
};

/**
 * Generate a secure certificate signing request (CSR) for API key
 * @param keyType - Type of API key (client, server, database)
 * @param userId - User ID
 * @returns CSR in PEM format
 */
export const generateCertificateSigningRequest = (keyType: string, userId: number): string => {
  // Generate a new key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Create CSR subject
  const subject = `/C=FR/ST=Paris/L=Paris/O=Vaelix Bank/CN=${keyType}-api-key-${userId}`;

  // Note: In a real implementation, you'd use a proper CSR library
  // This is a simplified version for demonstration
  const timestamp = Date.now();
  const base64Data = Buffer.from(`${subject}:${timestamp}`).toString('base64');
  const formattedBase64 = base64Data.match(/.{1,64}/g)?.join('\n') || base64Data;
  const mockCSR = `-----BEGIN CERTIFICATE REQUEST-----\n${formattedBase64}\n-----END CERTIFICATE REQUEST-----`;

  return mockCSR;
};

/**
 * Generate a self-signed certificate for API key authentication
 * @param apiKey - The API key (vb_ prefixed)
 * @param keyType - Type of API key (client, server, database)
 * @param userId - User ID
 * @param validityDays - Certificate validity period in days
 * @returns Object containing certificate PEM and private key
 */
export const generateSelfSignedCertificate = (
  apiKey: string,
  keyType: string,
  userId: number,
  validityDays: number = 365
): { certificate: string; privateKey: string; fingerprint: string } => {
  // Generate a new RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Certificate details
  const serialNumber = crypto.randomBytes(16).toString('hex').toUpperCase();
  const notBefore = new Date();
  const notAfter = new Date();
  notAfter.setDate(notAfter.getDate() + validityDays);

  // Certificate subject and issuer (self-signed)
  const subject = `/C=FR/ST=Paris/L=Paris/O=Vaelix Bank/CN=${apiKey}`;
  const issuer = subject;

  // Create a simplified self-signed certificate
  // Note: In production, use a proper certificate library like node-forge
  const certData = {
    version: 3,
    serialNumber,
    subject,
    issuer,
    notBefore: notBefore.toISOString(),
    notAfter: notAfter.toISOString(),
    publicKey: publicKey.replace(/\n/g, ''),
    signatureAlgorithm: 'sha256WithRSAEncryption'
  };

  // Create certificate PEM (simplified format)
  const certJson = JSON.stringify(certData);
  const certBase64 = Buffer.from(certJson).toString('base64');
  const formattedCert = certBase64.match(/.{1,64}/g)?.join('\n') || certBase64;

  const certificate = `-----BEGIN CERTIFICATE-----\n${formattedCert}\n-----END CERTIFICATE-----`;

  // Calculate fingerprint
  const fingerprint = crypto.createHash('sha256')
    .update(certificate)
    .digest('hex')
    .toUpperCase()
    .replace(/(.{2})(?!$)/g, '$1:');

  return {
    certificate,
    privateKey,
    fingerprint
  };
};

/**
 * Embed certificate information into API key structure
 * @param apiKey - The base API key
 * @param certificate - Certificate information
 * @returns Enhanced API key with embedded certificate data
 */
export const embedCertificateInKey = (apiKey: string, certificate: CertificateInfo): string => {
  // For now, we keep the key structure simple but ensure every vb_ key has a certificate
  // The certificate is stored in the database and linked to the key
  // Future enhancement: embed fingerprint hash in key for additional security
  return apiKey;
};

/**
 * Extract certificate fingerprint from embedded API key
 * @param apiKey - The API key with embedded certificate info
 * @returns Certificate fingerprint if embedded, null otherwise
 */
export const extractFingerprintFromKey = (apiKey: string): string | null => {
  // For now, return null as we don't embed fingerprint in key
  // The fingerprint is looked up from database
  return null;
};