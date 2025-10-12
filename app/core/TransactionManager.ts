import { AccountQueries } from '../queries/accountQueries';
import { logger } from '../utils/logger';

export interface TransactionRequest {
  type: 'internal_transfer' | 'external_send' | 'external_receive' | 'balance_adjustment';
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  currency: string;
  description?: string;
  external_reference?: string; // For Weavr transactions
}

export interface TransactionResult {
  success: boolean;
  transaction_id?: string;
  local_transaction_ids?: number[];
  error?: string;
  ledger_balance?: number;
}

export class TransactionManager {
  /**
   * Central transaction orchestrator - Ledger is the single source of truth
   * All transactions are validated and committed locally first
   */

  static async processTransaction(request: TransactionRequest): Promise<TransactionResult> {
    try {
      logger.info('Processing transaction', {
        type: request.type,
        amount: request.amount,
        currency: request.currency
      });

      switch (request.type) {
        case 'internal_transfer':
          return await this.processInternalTransfer(request);

        case 'external_send':
          return await this.processExternalSend(request);

        case 'external_receive':
          return await this.processExternalReceive(request);

        case 'balance_adjustment':
          return await this.processBalanceAdjustment(request);

        default:
          return { success: false, error: 'Unknown transaction type' };
      }
    } catch (error: any) {
      logger.error('Transaction processing failed', { error: error.message, request });
      return { success: false, error: error.message };
    }
  }

  private static async processInternalTransfer(request: TransactionRequest): Promise<TransactionResult> {
    if (!request.from_account_id || !request.to_account_id) {
      return { success: false, error: 'from_account_id and to_account_id required for internal transfer' };
    }

    // Validate accounts exist and are active
    const fromAccount = await AccountQueries.getAccountWithBalanceDetails(request.from_account_id);
    const toAccount = await AccountQueries.getAccountWithBalanceDetails(request.to_account_id);

    if (!fromAccount || !toAccount) {
      return { success: false, error: 'One or both accounts not found' };
    }

    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      return { success: false, error: 'Both accounts must be active' };
    }

    if (fromAccount.currency !== toAccount.currency) {
      return { success: false, error: 'Currency mismatch' };
    }

    if (fromAccount.available_balance < request.amount) {
      return { success: false, error: 'Insufficient funds' };
    }

    // Perform atomic transfer using database transaction
    const pool = (await import('../utils/database')).default;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Debit from account
      await client.query(
        'UPDATE accounts SET balance = balance - $1, available_balance = available_balance - $1, updated_at = NOW() WHERE id = $2',
        [request.amount, request.from_account_id]
      );

      // Credit to account
      await client.query(
        'UPDATE accounts SET balance = balance + $1, available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2',
        [request.amount, request.to_account_id]
      );

      // Record transactions
      const debitResult = await client.query(
        'INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
        [request.from_account_id, -request.amount, request.currency, 'internal_transfer_debit', 'completed', request.description || 'Internal transfer']
      );

      const creditResult = await client.query(
        'INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
        [request.to_account_id, request.amount, request.currency, 'internal_transfer_credit', 'completed', request.description || 'Internal transfer']
      );

      // Record balance changes
      await client.query(
        'INSERT INTO balance_changes (account_id, change_type, previous_balance, new_balance, change_amount, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [request.from_account_id, 'internal_transfer', fromAccount.balance, fromAccount.balance - request.amount, -request.amount, `Transfer to account ${request.to_account_id}`]
      );

      await client.query(
        'INSERT INTO balance_changes (account_id, change_type, previous_balance, new_balance, change_amount, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [request.to_account_id, 'internal_transfer', toAccount.balance, toAccount.balance + request.amount, request.amount, `Transfer from account ${request.from_account_id}`]
      );

      await client.query('COMMIT');

      const transactionId = `${debitResult.rows[0].id}_${creditResult.rows[0].id}`;

      logger.info('Internal transfer completed', {
        transactionId,
        from: request.from_account_id,
        to: request.to_account_id,
        amount: request.amount
      });

      return {
        success: true,
        transaction_id: transactionId,
        local_transaction_ids: [debitResult.rows[0].id, creditResult.rows[0].id],
        ledger_balance: fromAccount.balance - request.amount
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static async processExternalSend(request: TransactionRequest): Promise<TransactionResult> {
    // External sends are initiated locally but transmitted via RegulatoryGateway
    // This validates the transaction locally first, then delegates to Weavr for transmission

    if (!request.from_account_id) {
      return { success: false, error: 'from_account_id required for external send' };
    }

    const account = await AccountQueries.getAccountWithBalanceDetails(request.from_account_id);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    if (account.available_balance < request.amount) {
      return { success: false, error: 'Insufficient funds for external send' };
    }

    // Reserve the funds locally (block them)
    await AccountQueries.updateAccountBalance(request.from_account_id, -request.amount);
    await AccountQueries.recordBalanceChange(request.from_account_id, {
      change_type: 'external_send_pending',
      previous_balance: account.balance,
      new_balance: account.balance - request.amount,
      change_amount: -request.amount,
      description: `External send pending: ${request.description || 'External payment'}`
    });

    // Record pending transaction
    const pool = (await import('../utils/database')).default;
    const transactionResult = await pool.query(
      'INSERT INTO transactions (account_id, amount, currency, type, status, description, external_reference, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id',
      [request.from_account_id, -request.amount, request.currency, 'external_send', 'pending', request.description, request.external_reference]
    );

    logger.info('External send initiated locally', {
      transactionId: transactionResult.rows[0].id,
      accountId: request.from_account_id,
      amount: request.amount
    });

    return {
      success: true,
      transaction_id: transactionResult.rows[0].id.toString(),
      ledger_balance: account.balance - request.amount
    };
  }

  private static async processExternalReceive(request: TransactionRequest): Promise<TransactionResult> {
    // External receives are recorded locally when confirmed
    // Funds are credited only after regulatory confirmation

    if (!request.to_account_id) {
      return { success: false, error: 'to_account_id required for external receive' };
    }

    const account = await AccountQueries.getAccountWithBalanceDetails(request.to_account_id);
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Record pending receive transaction
    const pool = (await import('../utils/database')).default;
    const transactionResult = await pool.query(
      'INSERT INTO transactions (account_id, amount, currency, type, status, description, external_reference, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id',
      [request.to_account_id, request.amount, request.currency, 'external_receive', 'pending', request.description, request.external_reference]
    );

    logger.info('External receive recorded locally', {
      transactionId: transactionResult.rows[0].id,
      accountId: request.to_account_id,
      amount: request.amount
    });

    return {
      success: true,
      transaction_id: transactionResult.rows[0].id.toString()
    };
  }

  private static async processBalanceAdjustment(request: TransactionRequest): Promise<TransactionResult> {
    // Balance adjustments are administrative operations (like initial deposits)
    // Only allowed for authorized operations

    if (!request.to_account_id && !request.from_account_id) {
      return { success: false, error: 'Either to_account_id or from_account_id required for balance adjustment' };
    }

    const accountId = request.to_account_id || request.from_account_id!;
    const account = await AccountQueries.getAccountWithBalanceDetails(accountId);

    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Perform adjustment
    await AccountQueries.updateAccountBalance(accountId, request.amount);

    // Record transaction
    const pool = (await import('../utils/database')).default;
    const transactionResult = await pool.query(
      'INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
      [accountId, request.amount, request.currency, 'balance_adjustment', 'completed', request.description]
    );

    // Record balance change
    await AccountQueries.recordBalanceChange(accountId, {
      change_type: 'balance_adjustment',
      previous_balance: account.balance,
      new_balance: account.balance + request.amount,
      change_amount: request.amount,
      description: request.description || 'Administrative balance adjustment'
    });

    logger.info('Balance adjustment completed', {
      transactionId: transactionResult.rows[0].id,
      accountId,
      amount: request.amount
    });

    return {
      success: true,
      transaction_id: transactionResult.rows[0].id.toString(),
      ledger_balance: account.balance + request.amount
    };
  }

  /**
   * Confirm an external transaction (called by RegulatoryGateway after Weavr confirmation)
   */
  static async confirmExternalTransaction(localTransactionId: number, weavrReference?: string): Promise<boolean> {
    try {
      const pool = (await import('../utils/database')).default;

      // Update transaction status
      await pool.query(
        'UPDATE transactions SET status = $1, external_reference = $2, updated_at = NOW() WHERE id = $3',
        ['completed', weavrReference, localTransactionId]
      );

      logger.info('External transaction confirmed', { localTransactionId, weavrReference });
      return true;
    } catch (error: any) {
      logger.error('Failed to confirm external transaction', { localTransactionId, error: error.message });
      return false;
    }
  }

  /**
   * Fail an external transaction (called by RegulatoryGateway on failure)
   */
  static async failExternalTransaction(localTransactionId: number, reason?: string): Promise<boolean> {
    try {
      const pool = (await import('../utils/database')).default;

      // Get transaction details
      const transaction = await pool.query('SELECT * FROM transactions WHERE id = $1', [localTransactionId]);
      if (!transaction.rows[0]) return false;

      const tx = transaction.rows[0];

      // If it was a send, unblock the funds
      if (tx.type === 'external_send' && tx.status === 'pending') {
        await pool.query(
          'UPDATE accounts SET available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2',
          [Math.abs(tx.amount), tx.account_id]
        );
      }

      // Update transaction status
      await pool.query(
        'UPDATE transactions SET status = $1, description = description || $2, updated_at = NOW() WHERE id = $3',
        ['failed', reason ? ` - Failed: ${reason}` : ' - Failed', localTransactionId]
      );

      logger.info('External transaction failed', { localTransactionId, reason });
      return true;
    } catch (error: any) {
      logger.error('Failed to fail external transaction', { localTransactionId, error: error.message });
      return false;
    }
  }
}