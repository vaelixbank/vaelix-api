import { logger } from '../utils/logger';

export interface SWIFTTransferRequest {
  from_account: number;
  to_account_number: string;
  to_bic: string;
  amount: number;
  currency: string;
  beneficiary_name: string;
  beneficiary_address?: string;
  remittance_info?: string;
  message_type: 'MT103' | 'MT202' | 'MT103STP' | 'pacs008';
  charge_bearer?: 'SHA' | 'OUR' | 'BEN';
  intermediary_bic?: string;
  sender_reference?: string;
}

export interface SWIFTTransferResult {
  success: boolean;
  transfer_id?: string;
  swift_message?: string;
  error?: string;
  regulatory_reference?: string;
}

export class SWIFTService {
  /**
   * Validate SWIFT BIC code
   */
  static validateBIC(bic: string): boolean {
    // BIC format: 8 or 11 characters
    const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return bicRegex.test(bic.replace(/\s+/g, '').toUpperCase());
  }

  /**
   * Validate SWIFT message type
   */
  static validateMessageType(messageType: string): boolean {
    const validTypes = ['MT103', 'MT202', 'MT103STP', 'pacs008', 'pacs009'];
    return validTypes.includes(messageType);
  }

  /**
   * Validate SWIFT transfer request
   */
  static validateSWIFTTransfer(request: SWIFTTransferRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate BIC
    if (!this.validateBIC(request.to_bic)) {
      errors.push('Invalid recipient BIC format');
    }

    if (request.intermediary_bic && !this.validateBIC(request.intermediary_bic)) {
      errors.push('Invalid intermediary BIC format');
    }

    // Validate message type
    if (!this.validateMessageType(request.message_type)) {
      errors.push('Invalid SWIFT message type');
    }

    // Validate amount
    if (request.amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Validate beneficiary details
    if (!request.beneficiary_name || request.beneficiary_name.trim().length === 0) {
      errors.push('Beneficiary name is required');
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
   * Generate MT103 message (Single Customer Credit Transfer)
   */
  static generateMT103(request: SWIFTTransferRequest, senderBIC: string): string {
    const uetr = this.generateUETR();

    let message = '{1:F01' + senderBIC + '0000000000}'; // Basic Header
    message += '{2:I103' + request.to_bic + 'XXXXN}'; // Application Header
    message += '{3:{108:' + uetr + '}}'; // User Header
    message += '{4:\n'; // Text Block

    // Field 20: Sender's Reference
    message += ':20:' + (request.sender_reference || `REF${Date.now()}`) + '\n';

    // Field 23B: Bank Operation Code
    message += ':23B:CRED\n';

    // Field 32A: Value Date/Currency/Amount
    const valueDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    message += `:32A:${valueDate}${request.currency}${request.amount.toFixed(2)}\n`;

    // Field 33B: Currency/Instructed Amount (if different from 32A)
    // message += `:33B:${request.currency}${request.amount.toFixed(2)}\n`;

    // Field 50A: Ordering Customer
    message += ':50A:/' + senderBIC + '\n';

    // Field 52A: Ordering Institution (if applicable)
    // message += ':52A:' + senderBIC + '\n';

    // Field 53A: Sender's Correspondent (if applicable)

    // Field 54A: Receiver's Correspondent (if applicable)

    // Field 56A: Intermediary Institution
    if (request.intermediary_bic) {
      message += ':56A:/' + request.intermediary_bic + '\n';
    }

    // Field 57A: Account With Institution
    message += ':57A:/' + request.to_bic + '\n';

    // Field 59A: Beneficiary Customer
    message += ':59A:/' + request.to_account_number + '\n';
    message += request.beneficiary_name + '\n';
    if (request.beneficiary_address) {
      message += request.beneficiary_address + '\n';
    }

    // Field 70: Remittance Information
    if (request.remittance_info) {
      message += ':70:' + request.remittance_info + '\n';
    }

    // Field 71A: Details of Charges
    if (request.charge_bearer) {
      message += ':71A:' + request.charge_bearer + '\n';
    }

    // Field 72: Sender to Receiver Information
    message += ':72:/UETR/' + uetr + '\n';

    message += '-}'; // End of Text Block

    return message;
  }

  /**
   * Generate Unique End-to-End Transaction Reference (UETR)
   */
  static generateUETR(): string {
    // UETR is a 36-character UUID-like string
    return 'VO' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  /**
   * Process SWIFT transfer
   */
  static async processSWIFTTransfer(request: SWIFTTransferRequest, senderBIC: string): Promise<SWIFTTransferResult> {
    try {
      logger.info('Processing SWIFT transfer', {
        from_account: request.from_account,
        to_bic: request.to_bic,
        amount: request.amount,
        message_type: request.message_type
      });

      // Validate request
      const validation = this.validateSWIFTTransfer(request);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Generate SWIFT message
      let swiftMessage: string;
      switch (request.message_type) {
        case 'MT103':
        case 'MT103STP':
          swiftMessage = this.generateMT103(request, senderBIC);
          break;
        case 'MT202':
          // MT202 generation would be similar but for bank-to-bank
          swiftMessage = this.generateMT103(request, senderBIC); // Simplified
          break;
        case 'pacs008':
          // ISO 20022 pacs.008 would require XML generation
          swiftMessage = 'ISO20022_pacs008_placeholder';
          break;
        default:
          return {
            success: false,
            error: 'Unsupported message type'
          };
      }

      // Delegate to TransactionManager
      const { TransactionManager } = await import('../core/TransactionManager');

      const result = await TransactionManager.processTransaction({
        type: 'external_send',
        from_account_id: request.from_account,
        amount: request.amount,
        currency: request.currency,
        description: `SWIFT ${request.message_type}: ${request.remittance_info || 'Transfer'}`,
        external_reference: `SWIFT-${request.message_type}-${Date.now()}`
      });

      if (result.success) {
        const regulatoryRef = `SWIFT-${request.message_type}-${result.transaction_id}`;

        return {
          success: true,
          transfer_id: result.transaction_id,
          swift_message: swiftMessage,
          regulatory_reference: regulatoryRef
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error: any) {
      logger.error('SWIFT transfer processing failed', { error: error.message, request });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse incoming SWIFT message (basic implementation)
   */
  static parseSWIFTMessage(message: string): any {
    try {
      // Basic parsing - in production, use proper SWIFT parser
      const blocks = message.split('}');
      const parsed = {
        basic_header: blocks[0]?.replace('{1:', ''),
        application_header: blocks[1]?.replace('{2:', ''),
        user_header: blocks[2]?.replace('{3:', ''),
        text: blocks[3]?.replace('{4:', '').replace('-}', '')
      };

      return parsed;
    } catch (error) {
      logger.error('SWIFT message parsing failed', { error });
      return null;
    }
  }

  /**
   * Check SWIFT compliance and sanctions screening
   */
  static async checkCompliance(request: SWIFTTransferRequest): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // High-value transfer check
    if (request.amount > 10000) {
      issues.push('High-value transfer requires enhanced due diligence');
    }

    // Sanctions screening (simplified - would integrate with external service)
    // Check beneficiary name against sanctions lists

    // Regulatory reporting requirements
    if (request.amount > 15000 && ['USD', 'EUR', 'GBP'].includes(request.currency)) {
      issues.push('Transfer may be subject to regulatory reporting');
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }
}

export const swiftService = new SWIFTService();