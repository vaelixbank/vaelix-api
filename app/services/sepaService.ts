import { logger } from '../utils/logger';

export interface SEPATransferRequest {
  from_account: number;
  to_iban: string;
  to_bic?: string;
  amount: number;
  currency: string;
  beneficiary_name: string;
  remittance_info?: string;
  scheme: 'SCT' | 'SDD';
  charge_bearer?: 'SHA' | 'OUR' | 'BEN';
}

export interface SEPATransferResult {
  success: boolean;
  transfer_id?: string;
  error?: string;
  regulatory_reference?: string;
}

export class SEPAService {
  /**
   * Validate IBAN format and checksum
   */
  static validateIBAN(iban: string): boolean {
    try {
      // Remove spaces and convert to uppercase
      const cleanIBAN = iban.replace(/\s+/g, '').toUpperCase();

      // Basic format check
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleanIBAN)) {
        return false;
      }

      // Move first 4 characters to end
      const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);

      // Convert letters to numbers (A=10, B=11, etc.)
      const numericIBAN = rearranged.split('').map(char => {
        const code = char.charCodeAt(0);
        return code >= 65 && code <= 90 ? (code - 55).toString() : char;
      }).join('');

      // Checksum validation using modulo 97
      const checksum = BigInt(numericIBAN) % 97n;
      return checksum === 1n;
    } catch (error) {
      logger.error('IBAN validation error', { iban, error });
      return false;
    }
  }

  /**
   * Validate BIC/SWIFT code format
   */
  static validateBIC(bic: string): boolean {
    // BIC format: 8 or 11 characters
    // XXXXYYZZ or XXXXYYZZZZZ where:
    // XXXX = Bank code
    // YY = Country code
    // ZZ/ZZZZZ = Location code
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return bicRegex.test(bic.replace(/\s+/g, '').toUpperCase());
  }

  /**
   * Validate SEPA transfer request
   */
  static validateSEPATransfer(request: SEPATransferRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate IBAN
    if (!this.validateIBAN(request.to_iban)) {
      errors.push('Invalid IBAN format');
    }

    // Validate BIC if provided
    if (request.to_bic && !this.validateBIC(request.to_bic)) {
      errors.push('Invalid BIC format');
    }

    // Validate amount (SEPA limits)
    if (request.amount <= 0) {
      errors.push('Amount must be positive');
    }

    // SEPA amount limits (EUR 0.01 to 999,999,999.99)
    if (request.currency === 'EUR' && (request.amount < 0.01 || request.amount > 999999999.99)) {
      errors.push('SEPA EUR amount must be between 0.01 and 999,999,999.99');
    }

    // Validate beneficiary name
    if (!request.beneficiary_name || request.beneficiary_name.trim().length === 0) {
      errors.push('Beneficiary name is required');
    }

    // Validate scheme
    if (!['SCT', 'SDD'].includes(request.scheme)) {
      errors.push('Invalid SEPA scheme. Must be SCT or SDD');
    }

    // Validate charge bearer
    if (request.charge_bearer && !['SHA', 'OUR', 'BEN'].includes(request.charge_bearer)) {
      errors.push('Invalid charge bearer. Must be SHA, OUR, or BEN');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Process SEPA Credit Transfer (SCT)
   */
  static async processSCT(request: SEPATransferRequest): Promise<SEPATransferResult> {
    try {
      logger.info('Processing SEPA Credit Transfer', {
        from_account: request.from_account,
        to_iban: request.to_iban,
        amount: request.amount,
        currency: request.currency
      });

      // Validate request
      const validation = this.validateSEPATransfer(request);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // For now, delegate to TransactionManager
      // In production, this would integrate with SEPA clearing systems
      const { TransactionManager } = await import('../core/TransactionManager');

      const result = await TransactionManager.processTransaction({
        type: 'external_send',
        from_account_id: request.from_account,
        amount: request.amount,
        currency: request.currency,
        description: `SEPA ${request.scheme}: ${request.remittance_info || 'Transfer'}`,
        external_reference: `SEPA-${Date.now()}`
      });

      if (result.success) {
        // Generate regulatory reference
        const regulatoryRef = `SEPA-${request.scheme}-${result.transaction_id}`;

        return {
          success: true,
          transfer_id: result.transaction_id,
          regulatory_reference: regulatoryRef
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error: any) {
      logger.error('SEPA SCT processing failed', { error: error.message, request });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process SEPA Direct Debit (SDD)
   */
  static async processSDD(request: SEPATransferRequest): Promise<SEPATransferResult> {
    try {
      logger.info('Processing SEPA Direct Debit', {
        from_account: request.from_account,
        to_iban: request.to_iban,
        amount: request.amount,
        currency: request.currency
      });

      // Validate request
      const validation = this.validateSEPATransfer(request);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // SDD requires mandate reference (would be stored separately)
      // For now, basic implementation
      const { TransactionManager } = await import('../core/TransactionManager');

      const result = await TransactionManager.processTransaction({
        type: 'external_receive', // SDD is a receive from debtor's perspective
        to_account_id: request.from_account,
        amount: request.amount,
        currency: request.currency,
        description: `SEPA ${request.scheme}: ${request.remittance_info || 'Direct Debit'}`,
        external_reference: `SDD-${Date.now()}`
      });

      if (result.success) {
        const regulatoryRef = `SEPA-${request.scheme}-${result.transaction_id}`;

        return {
          success: true,
          transfer_id: result.transaction_id,
          regulatory_reference: regulatoryRef
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error: any) {
      logger.error('SEPA SDD processing failed', { error: error.message, request });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check SEPA compliance and regulatory requirements
   */
  static async checkCompliance(request: SEPATransferRequest): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check amount limits
    if (request.amount > 50000 && request.currency === 'EUR') {
      issues.push('High-value transfer may require additional verification');
    }

    // Check for sanctioned countries/entities (simplified)
    // In production, integrate with sanctions screening service

    // Check business rules
    if (request.scheme === 'SDD' && !request.remittance_info?.includes('MANDATE')) {
      issues.push('SDD requires mandate reference');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }
}

export const sepaService = new SEPAService();