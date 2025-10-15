import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { SEPAService, SEPATransferRequest } from '../services/sepaService';
import { SWIFTService, SWIFTTransferRequest } from '../services/swiftService';
import { TransactionManager } from '../core/TransactionManager';

export class InterbankController {
  /**
   * Initiate SEPA transfer
   */
  async initiateSEPATransfer(req: Request, res: Response) {
    try {
      const {
        from_account,
        to_iban,
        to_bic,
        amount,
        currency = 'EUR',
        beneficiary_name,
        remittance_info,
        scheme = 'SCT',
        charge_bearer = 'SHA'
      } = req.body;

      const sepaRequest: SEPATransferRequest = {
        from_account: parseInt(from_account),
        to_iban,
        to_bic,
        amount: parseFloat(amount),
        currency,
        beneficiary_name,
        remittance_info,
        scheme,
        charge_bearer
      };

      logger.info('Initiating SEPA transfer', { from_account, to_iban, amount, scheme });

      // Check compliance
      const complianceCheck = await SEPAService.checkCompliance(sepaRequest);
      if (!complianceCheck.compliant) {
        return ApiResponseHandler.error(
          res,
          `Compliance check failed: ${complianceCheck.issues.join(', ')}`,
          'COMPLIANCE_FAILED',
          400
        );
      }

      // Process transfer
      const result = await TransactionManager.processTransaction({
        type: 'sepa_transfer',
        amount: sepaRequest.amount,
        currency: sepaRequest.currency,
        description: `SEPA ${scheme} Transfer`,
        transfer_details: sepaRequest
      });

      if (result.success) {
        return ApiResponseHandler.created(res, {
          transfer_id: result.transaction_id,
          status: 'initiated',
          regulatory_reference: result.transaction_id // Would be generated properly
        });
      } else {
        return ApiResponseHandler.error(res, result.error || 'Transfer failed', 'TRANSFER_FAILED', 400);
      }
    } catch (error: any) {
      logger.error('SEPA transfer initiation failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Initiate SWIFT transfer
   */
  async initiateSWIFTTransfer(req: Request, res: Response) {
    try {
      const {
        from_account,
        to_account_number,
        to_bic,
        amount,
        currency,
        beneficiary_name,
        beneficiary_address,
        remittance_info,
        message_type = 'MT103',
        charge_bearer = 'SHA',
        intermediary_bic,
        sender_reference
      } = req.body;

      const swiftRequest: SWIFTTransferRequest = {
        from_account: parseInt(from_account),
        to_account_number,
        to_bic,
        amount: parseFloat(amount),
        currency,
        beneficiary_name,
        beneficiary_address,
        remittance_info,
        message_type,
        charge_bearer,
        intermediary_bic,
        sender_reference
      };

      logger.info('Initiating SWIFT transfer', { from_account, to_bic, amount, message_type });

      // Check compliance
      const compliance = await SWIFTService.checkCompliance(swiftRequest);
      if (!compliance.compliant) {
        return ApiResponseHandler.error(
          res,
          `Compliance check failed: ${compliance.issues.join(', ')}`,
          'COMPLIANCE_FAILED',
          400
        );
      }

      // Process transfer
      const result = await TransactionManager.processTransaction({
        type: 'swift_transfer',
        amount: swiftRequest.amount,
        currency: swiftRequest.currency,
        description: `SWIFT ${message_type} Transfer`,
        transfer_details: swiftRequest
      });

      if (result.success) {
        return ApiResponseHandler.created(res, {
          transfer_id: result.transaction_id,
          status: 'initiated',
          message_type,
          regulatory_reference: result.transaction_id
        });
      } else {
        return ApiResponseHandler.error(res, result.error || 'Transfer failed', 'TRANSFER_FAILED', 400);
      }
    } catch (error: any) {
      logger.error('SWIFT transfer initiation failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(req: Request, res: Response) {
    try {
      const { transfer_id } = req.params;

      // Query transaction status from database
      const pool = (await import('../utils/database')).default;
      const result = await pool.query(
        'SELECT id, type, status, amount, currency, description, created_at, updated_at FROM transactions WHERE id = $1',
        [transfer_id]
      );

      if (!result.rows[0]) {
        return ApiResponseHandler.error(res, 'Transfer not found', 'NOT_FOUND', 404);
      }

      const transfer = result.rows[0];

      return ApiResponseHandler.success(res, {
        transfer_id: transfer.id,
        type: transfer.type,
        status: transfer.status,
        amount: transfer.amount,
        currency: transfer.currency,
        description: transfer.description,
        created_at: transfer.created_at,
        updated_at: transfer.updated_at
      });
    } catch (error: any) {
      logger.error('Get transfer status failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Validate IBAN
   */
  async validateIBAN(req: Request, res: Response) {
    try {
      const { iban } = req.body;

      if (!iban) {
        return ApiResponseHandler.error(res, 'IBAN is required', 'VALIDATION_ERROR', 400);
      }

      const isValid = SEPAService.validateIBAN(iban);

      return ApiResponseHandler.success(res, {
        iban,
        valid: isValid
      });
    } catch (error: any) {
      logger.error('IBAN validation failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Validate BIC
   */
  async validateBIC(req: Request, res: Response) {
    try {
      const { bic } = req.body;

      if (!bic) {
        return ApiResponseHandler.error(res, 'BIC is required', 'VALIDATION_ERROR', 400);
      }

      const ibanValid = SEPAService.validateBIC(bic);
      const swiftValid = SWIFTService.validateBIC(bic);

      return ApiResponseHandler.success(res, {
        bic,
        valid: ibanValid || swiftValid // BIC can be used in both contexts
      });
    } catch (error: any) {
      logger.error('BIC validation failed', { error: error.message });
      return ApiResponseHandler.error(res, 'Internal server error', 'INTERNAL_ERROR', 500);
    }
  }
}

export const interbankController = new InterbankController();