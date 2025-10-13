import { Request, Response } from 'express';
import { TransactionManager } from '../core/TransactionManager';
import { RegulatoryGateway } from '../core/RegulatoryGateway';
import { WeavrService } from '../services/weavrService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';

export class RegulatoryController {
  private regulatoryGateway: RegulatoryGateway;

  constructor(regulatoryGateway: RegulatoryGateway) {
    this.regulatoryGateway = regulatoryGateway;
  }

  // =========================================
  // REGULATORY OPERATIONS - LIMITED WEAVR INTERACTION
  // =========================================

  /**
   * Process any transaction through the central TransactionManager
   */
  async processTransaction(req: Request, res: Response) {
    try {
      const result = await TransactionManager.processTransaction(req.body);

      if (result.success) {
        return ApiResponseHandler.success(res, result);
      } else {
        return ApiResponseHandler.error(res, result.error || 'Transaction failed', 'TRANSACTION_FAILED', 400);
      }
    } catch (error: any) {
      logger.error('Transaction processing error', { error: error.message });
      return ApiResponseHandler.error(res, 'Transaction processing failed', 'INTERNAL_ERROR', 500);
    }
  }

  /**
    * Generate IBAN for regulatory compliance
    */
  async generateIBAN(req: Request, res: Response) {
    try {
      const { account_id, country_code, holder_name } = req.body;

      if (!account_id) {
        return ApiResponseHandler.error(res, 'account_id is required', 'VALIDATION_ERROR', 400);
      }

      const result = await this.regulatoryGateway.generateIBAN(
        { account_id, country_code, holder_name }
      );

      if (result.success) {
        return ApiResponseHandler.success(res, {
          iban: result.iban,
          bic: result.bic,
          message: 'IBAN generated for regulatory compliance'
        });
      } else {
        return ApiResponseHandler.error(res, result.error || 'IBAN generation failed', 'REGULATORY_ERROR', 400);
      }
    } catch (error: any) {
      logger.error('IBAN generation error', { error: error.message });
      return ApiResponseHandler.error(res, 'IBAN generation failed', 'INTERNAL_ERROR', 500);
    }
  }

  /**
    * Send external payment through regulatory gateway
    */
  async sendExternalPayment(req: Request, res: Response) {
    try {
      const {
        from_account_id,
        amount,
        currency,
        beneficiary_details,
        description
      } = req.body;

      if (!from_account_id || !amount || !beneficiary_details) {
        return ApiResponseHandler.error(res, 'from_account_id, amount, and beneficiary_details are required', 'VALIDATION_ERROR', 400);
      }

      // First, process through TransactionManager to reserve funds locally
      const localResult = await TransactionManager.processTransaction({
        type: 'external_send',
        from_account_id,
        amount,
        currency: currency || 'EUR',
        description,
        external_reference: `external_send_${Date.now()}`
      });

      if (!localResult.success || !localResult.transaction_id) {
        return ApiResponseHandler.error(res, localResult.error || 'Local transaction failed', 'TRANSACTION_FAILED', 400);
      }

      // Then send through regulatory gateway
      const regulatoryResult = await this.regulatoryGateway.sendExternalPayment({
        from_account_id,
        amount,
        currency: currency || 'EUR',
        beneficiary_details,
        description,
        local_transaction_id: parseInt(localResult.transaction_id)
      });

      if (regulatoryResult.success) {
        return ApiResponseHandler.success(res, {
          transaction_id: localResult.transaction_id,
          weavr_reference: regulatoryResult.weavr_reference,
          status: 'sent',
          message: 'Payment sent through regulatory gateway'
        });
      } else {
        return ApiResponseHandler.error(res, regulatoryResult.error || 'Regulatory transmission failed', 'REGULATORY_ERROR', 400);
      }
    } catch (error: any) {
      logger.error('External payment error', { error: error.message });
      return ApiResponseHandler.error(res, 'External payment failed', 'INTERNAL_ERROR', 500);
    }
  }

  /**
    * Confirm external receive (called by webhooks or manual confirmation)
    */
  async confirmExternalReceive(req: Request, res: Response) {
    try {
      const { local_transaction_id, weavr_reference } = req.body;

      if (!local_transaction_id || !weavr_reference) {
        return ApiResponseHandler.error(res, 'local_transaction_id and weavr_reference are required', 'VALIDATION_ERROR', 400);
      }

      const success = await this.regulatoryGateway.confirmExternalReceive(
        local_transaction_id,
        weavr_reference
      );

      if (success) {
        return ApiResponseHandler.success(res, {
          message: 'External receive confirmed and funds credited to account'
        });
      } else {
        return ApiResponseHandler.error(res, 'External receive confirmation failed', 'REGULATORY_ERROR', 400);
      }
    } catch (error: any) {
      logger.error('External receive confirmation error', { error: error.message });
      return ApiResponseHandler.error(res, 'External receive confirmation failed', 'INTERNAL_ERROR', 500);
    }
  }

  /**
    * Get account IBAN details
    */
  async getAccountIBAN(req: Request, res: Response) {
    try {
      const { account_id } = req.params;

      if (!account_id) {
        return ApiResponseHandler.error(res, 'account_id is required', 'VALIDATION_ERROR', 400);
      }

      const result = await this.regulatoryGateway.getAccountIBAN(
        parseInt(account_id)
      );

      if (result.success) {
        return ApiResponseHandler.success(res, {
          iban: result.iban,
          bic: result.bic
        });
      } else {
        return ApiResponseHandler.error(res, result.error || 'IBAN retrieval failed', 'REGULATORY_ERROR', 400);
      }
    } catch (error: any) {
      logger.error('IBAN retrieval error', { error: error.message });
      return ApiResponseHandler.error(res, 'IBAN retrieval failed', 'INTERNAL_ERROR', 500);
    }
  }

  /**
   * Administrative balance adjustment (for initial setup, corrections, etc.)
   */
  async adjustBalance(req: Request, res: Response) {
    try {
      const { account_id, amount, description } = req.body;

      if (!account_id || typeof amount !== 'number') {
        return ApiResponseHandler.error(res, 'account_id and amount are required', 'VALIDATION_ERROR', 400);
      }

      const result = await TransactionManager.processTransaction({
        type: 'balance_adjustment',
        to_account_id: account_id,
        amount,
        currency: 'EUR', // Assuming EUR for adjustments
        description: description || 'Administrative balance adjustment'
      });

      if (result.success) {
        return ApiResponseHandler.success(res, {
          transaction_id: result.transaction_id,
          new_balance: result.ledger_balance,
          message: 'Balance adjusted successfully'
        });
      } else {
        return ApiResponseHandler.error(res, result.error || 'Balance adjustment failed', 'TRANSACTION_FAILED', 400);
      }
    } catch (error: any) {
      logger.error('Balance adjustment error', { error: error.message });
      return ApiResponseHandler.error(res, 'Balance adjustment failed', 'INTERNAL_ERROR', 500);
    }
  }
}