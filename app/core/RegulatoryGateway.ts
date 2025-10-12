import { WeavrService } from '../services/weavrService';
import { TransactionManager } from './TransactionManager';
import { AccountQueries } from '../queries/accountQueries';
import { logger } from '../utils/logger';

export interface ExternalPaymentRequest {
  from_account_id: number;
  amount: number;
  currency: string;
  beneficiary_details: {
    name: string;
    iban?: string;
    bic?: string;
    account_number?: string;
  };
  description?: string;
  local_transaction_id: number;
}

export interface ExternalPaymentResult {
  success: boolean;
  weavr_reference?: string;
  error?: string;
}

export interface IBANRequest {
  account_id: number;
  country_code?: string;
  holder_name?: string;
}

export interface IBANResult {
  success: boolean;
  iban?: string;
  bic?: string;
  error?: string;
}

export class RegulatoryGateway {
  private weavrService: WeavrService;

  constructor(weavrService: WeavrService) {
    this.weavrService = weavrService;
  }

  /**
   * REGULATORY GATEWAY - LIMITED WEAVR INTERACTIONS
   *
   * Weavr is used ONLY for:
   * 1. Generating IBANs for regulatory compliance
   * 2. Transmitting payments to external banking network
   * 3. Receiving external payments with regulatory validation
   *
   * ALL business logic, balances, and transaction validation remains in local ledger
   */

  /**
   * Generate IBAN for an account (regulatory compliance)
   */
  async generateIBAN(request: IBANRequest, apiKey: string, authToken: string): Promise<IBANResult> {
    try {
      logger.info('Generating IBAN via Regulatory Gateway', { accountId: request.account_id });

      // Get account details
      const account = await AccountQueries.getAccountById(request.account_id);
      if (!account?.weavr_id) {
        return { success: false, error: 'Account not synced with regulatory provider' };
      }

      // Request IBAN from Weavr
      const ibanResult = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${account.weavr_id}/iban`,
        {
          iban_country_code: request.country_code || 'FR',
          iban_holder_name: request.holder_name || account.account_name || `Account ${account.id}`
        },
        apiKey,
        authToken
      );

      // Extract IBAN details
      let iban: string | undefined;
      let bic: string | undefined;

      if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
        const details = ibanResult.bankAccountDetails[0];
        iban = details.details?.iban;
        bic = details.details?.bankIdentifierCode;
      }

      if (iban) {
        // Update local account with IBAN
        await AccountQueries.updateAccountWithWeavrData(request.account_id, {
          iban,
          bic,
          last_weavr_sync: new Date(),
          sync_status: ibanResult.state === 'ALLOCATED' ? 'iban_allocated' : 'iban_pending'
        });

        logger.info('IBAN generated successfully', { accountId: request.account_id, iban });
        return { success: true, iban, bic };
      } else {
        return { success: false, error: 'IBAN allocation failed' };
      }

    } catch (error: any) {
      logger.error('IBAN generation failed', { accountId: request.account_id, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment to external beneficiary (regulatory transmission)
   */
  async sendExternalPayment(request: ExternalPaymentRequest, apiKey: string, authToken: string): Promise<ExternalPaymentResult> {
    try {
      logger.info('Sending external payment via Regulatory Gateway', {
        accountId: request.from_account_id,
        amount: request.amount,
        localTransactionId: request.local_transaction_id
      });

      // Get account details
      const account = await AccountQueries.getAccountById(request.from_account_id);
      if (!account?.weavr_id) {
        await TransactionManager.failExternalTransaction(request.local_transaction_id, 'Account not synced with regulatory provider');
        return { success: false, error: 'Account not synced with regulatory provider' };
      }

      // Prepare Weavr send request
      const sendData = {
        profile_id: account.weavr_profile_id,
        source: {
          type: 'managed_account',
          id: account.weavr_id
        },
        destination: {
          type: 'beneficiary',
          id: request.beneficiary_details.iban || request.beneficiary_details.account_number
        },
        amount: request.amount,
        currency: request.currency,
        description: request.description || 'External payment'
      };

      // Send via Weavr
      const weavrResult = await this.weavrService.makeRequest(
        'POST',
        '/multi/sends',
        sendData,
        apiKey,
        authToken
      );

      // Confirm the local transaction
      await TransactionManager.confirmExternalTransaction(request.local_transaction_id, weavrResult.id);

      logger.info('External payment sent successfully', {
        localTransactionId: request.local_transaction_id,
        weavrReference: weavrResult.id
      });

      return { success: true, weavr_reference: weavrResult.id };

    } catch (error: any) {
      logger.error('External payment failed', {
        accountId: request.from_account_id,
        localTransactionId: request.local_transaction_id,
        error: error.message
      });

      // Fail the local transaction
      await TransactionManager.failExternalTransaction(request.local_transaction_id, error.message);

      return { success: false, error: error.message };
    }
  }

  /**
   * Receive external payment (regulatory confirmation)
   */
  async confirmExternalReceive(localTransactionId: number, weavrReference: string, apiKey: string, authToken: string): Promise<boolean> {
    try {
      logger.info('Confirming external receive via Regulatory Gateway', {
        localTransactionId,
        weavrReference
      });

      // Get transaction details
      const pool = (await import('../utils/database')).default;
      const transaction = await pool.query('SELECT * FROM transactions WHERE id = $1', [localTransactionId]);

      if (!transaction.rows[0]) {
        logger.error('Transaction not found for external receive confirmation', { localTransactionId });
        return false;
      }

      const tx = transaction.rows[0];

      // Credit the account
      await pool.query(
        'UPDATE accounts SET balance = balance + $1, available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2',
        [tx.amount, tx.account_id]
      );

      // Update transaction
      await pool.query(
        'UPDATE transactions SET status = $1, external_reference = $2, updated_at = NOW() WHERE id = $3',
        ['completed', weavrReference, localTransactionId]
      );

      // Record balance change
      const account = await AccountQueries.getAccountWithBalanceDetails(tx.account_id);
      await AccountQueries.recordBalanceChange(tx.account_id, {
        change_type: 'external_receive',
        previous_balance: account!.balance - tx.amount,
        new_balance: account!.balance,
        change_amount: tx.amount,
        description: `External receive confirmed: ${weavrReference}`
      });

      logger.info('External receive confirmed successfully', {
        localTransactionId,
        weavrReference,
        accountId: tx.account_id,
        amount: tx.amount
      });

      return true;

    } catch (error: any) {
      logger.error('External receive confirmation failed', {
        localTransactionId,
        weavrReference,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get account IBAN details (read-only regulatory info)
   */
  async getAccountIBAN(accountId: number, apiKey: string, authToken: string): Promise<IBANResult> {
    try {
      const account = await AccountQueries.getAccountById(accountId);
      if (!account?.weavr_id) {
        return { success: false, error: 'Account not synced with regulatory provider' };
      }

      const ibanResult = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${account.weavr_id}/iban`,
        undefined,
        apiKey,
        authToken
      );

      if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
        const details = ibanResult.bankAccountDetails[0];
        return {
          success: true,
          iban: details.details?.iban,
          bic: details.details?.bankIdentifierCode
        };
      }

      return { success: false, error: 'IBAN not available' };

    } catch (error: any) {
      logger.error('Failed to get account IBAN', { accountId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate regulatory compliance for a transaction (placeholder)
   * This could include AML checks, sanctions screening, etc.
   */
  async validateRegulatoryCompliance(transactionData: any): Promise<{ compliant: boolean; reason?: string }> {
    // Placeholder for regulatory compliance checks
    // In a real implementation, this would call Weavr compliance endpoints
    // or integrate with external compliance services

    logger.info('Regulatory compliance validation', { transactionData });

    // For now, assume compliant
    return { compliant: true };
  }

  /**
   * Report transaction to regulatory authorities (if required)
   */
  async reportTransaction(transactionId: string, reportData: any): Promise<boolean> {
    // Placeholder for regulatory reporting
    // This would submit required reports to financial authorities

    logger.info('Regulatory transaction reporting', { transactionId, reportData });

    // For now, just log
    return true;
  }
}