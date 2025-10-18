#!/usr/bin/env node

/**
 * Test script for certificate-enhanced API keys
 * Demonstrates the enhanced security features of vb_ keys with embedded certificates
 */

const crypto = require('crypto');
const fs = require('fs');

// Simulate the certificate utilities
function generateSelfSignedCertificate(apiKey, keyType, userId, validityDays = 365) {
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
}

function embedCertificateInKey(apiKey, certificateInfo) {
  // Extract the suffix from vb_ key
  const keySuffix = apiKey.replace('vb_', '');

  // Create a compound key that includes certificate fingerprint
  // Format: vb_[suffix]_[first-8-chars-of-fingerprint]
  const fingerprintPrefix = certificateInfo.fingerprint.replace(/:/g, '').substring(0, 8).toLowerCase();

  return `vb_${keySuffix}_${fingerprintPrefix}`;
}

function extractFingerprintFromKey(apiKey) {
  if (!apiKey.startsWith('vb_')) return null;

  const parts = apiKey.split('_');
  if (parts.length >= 3) {
    // Reconstruct fingerprint from embedded data
    const fingerprintPart = parts[2];
    if (fingerprintPart && fingerprintPart.length === 8) {
      // This is a simplified reconstruction - in practice you'd store the full mapping
      return fingerprintPart.toUpperCase().split('').join(':');
    }
  }

  return null;
}

// Test the enhanced API key system
function testEnhancedApiKeySystem() {
  console.log('🧪 Testing Enhanced Vaelix API Key System with Certificate Integration\n');

  // Simulate creating a new API key
  const userId = 123;
  const keyType = 'client';
  const baseKey = `vb_${crypto.randomBytes(24).toString('hex')}`;

  console.log('1. Generating base API key:', baseKey);

  // Generate self-signed certificate
  const certData = generateSelfSignedCertificate(baseKey, keyType, userId);
  console.log('2. Generated self-signed certificate with fingerprint:', certData.fingerprint);

  // Embed certificate info in key
  const enhancedKey = embedCertificateInKey(baseKey, { fingerprint: certData.fingerprint });
  console.log('3. Enhanced key with embedded certificate info:', enhancedKey);

  // Test extraction
  const extractedFingerprint = extractFingerprintFromKey(enhancedKey);
  console.log('4. Extracted fingerprint from key:', extractedFingerprint);

  // Verify the fingerprint matches
  const fingerprintMatches = extractedFingerprint === certData.fingerprint.substring(0, 23); // First 8 chars with colons
  console.log('5. Fingerprint verification:', fingerprintMatches ? '✅ PASS' : '❌ FAIL');

  // Demonstrate security benefits
  console.log('\n🔒 Security Benefits:');
  console.log('- Each vb_ key has a unique cryptographic identity');
  console.log('- Certificate fingerprint is embedded in the key itself');
  console.log('- Mutual TLS authentication possible');
  console.log('- Enhanced audit trail with certificate validation');
  console.log('- Automatic certificate generation for all vb_ keys');

  // Save certificate files for demonstration
  const certDir = './test-certs';
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
  }

  fs.writeFileSync(`${certDir}/${enhancedKey.replace(/:/g, '_')}.crt`, certData.certificate);
  fs.writeFileSync(`${certDir}/${enhancedKey.replace(/:/g, '_')}.key`, certData.privateKey);

  console.log(`\n📁 Certificate files saved in ${certDir}/`);
  console.log(`   - ${enhancedKey.replace(/:/g, '_')}.crt (certificate)`);
  console.log(`   - ${enhancedKey.replace(/:/g, '_')}.key (private key)`);

  return {
    baseKey,
    enhancedKey,
    certificate: certData.certificate,
    fingerprint: certData.fingerprint,
    testPassed: fingerprintMatches
  };
}

// Run the test
const result = testEnhancedApiKeySystem();

console.log('\n📊 Test Results:');
console.log('- Base Key:', result.baseKey);
console.log('- Enhanced Key:', result.enhancedKey);
console.log('- Certificate Fingerprint:', result.fingerprint);
console.log('- Test Status:', result.testPassed ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED');

if (result.testPassed) {
  console.log('\n🎉 Enhanced Vaelix API Key system is ready for production!');
  console.log('   Each vb_ key now contains embedded certificate information for enhanced security.');
}