import { Request, Response } from 'express';
import { AccountQueries } from '../queries/accountQueries';
import { logger } from '../utils/logger';

export class LedgerController {
  // =========================================
  // ACCOUNT MANAGEMENT - LEDGER FIRST
  // =========================================

  static async createAccount(req: Request, res: Response) {
    try {
      const { user_id, account_number, account_type, currency = 'EUR' } = req.body;

      // Create account in ledger first
      const account = await AccountQueries.createAccount(
        user_id,
        account_number,
        account_type,
        currency,
        0, // initial balance
        'active' // status
      );

      return res.status(201).json({
        success: true,
        data: account,
        note: 'Account created in ledger successfully.'
      });

    } catch (error: any) {
      logger.error('Account creation failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to create account' });
    }
  }

  static async getAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await AccountQueries.getAccountWithBalanceDetails(parseInt(id));

      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }

      return res.json({ success: true, data: account });

    } catch (error: any) {
      logger.error('Failed to get account', { accountId: req.params.id, error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to retrieve account' });
    }
  }

  static async getAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await AccountQueries.getAccountWithBalanceDetails(parseInt(id));

      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }

      // Return comprehensive balance information from ledger
      return res.json({
        success: true,
        data: {
          account_id: account.id,
          iban: account.iban,
          bic: account.bic,
          currency: account.currency,
          balances: {
            total: account.balance,
            available: account.available_balance || account.balance,
            blocked: account.blocked_balance || 0,
            reserved: account.reserved_balance || 0
          },
          last_updated: account.updated_at,
          sync_status: account.sync_status || 'local_only'
        }
      });

    } catch (error: any) {
      logger.error('Failed to get account balance', { accountId: req.params.id, error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to retrieve balance' });
    }
  }

  static async updateAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;

      if (typeof amount !== 'number' || amount === 0) {
        return res.status(400).json({ success: false, error: 'Invalid amount' });
      }

      // Get current account state
      const account = await AccountQueries.getAccountWithBalanceDetails(parseInt(id));
      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }

      // Update balance in ledger
      const updatedAccount = await AccountQueries.updateAccountBalance(parseInt(id), amount);

      // Record balance change in history
      await AccountQueries.recordBalanceChange(parseInt(id), {
        change_type: 'api_update',
        previous_balance: account.balance,
        new_balance: updatedAccount.balance,
        change_amount: amount,
        description: description || `Balance update via API`
      });

      return res.json({
        success: true,
        data: {
          account_id: updatedAccount.id,
          previous_balance: account.balance,
          new_balance: updatedAccount.balance,
          change_amount: amount,
          currency: updatedAccount.currency
        }
      });

    } catch (error: any) {
      logger.error('Failed to update account balance', { accountId: req.params.id, error: error.message });
      return res.status(500).json({ success: false, error: 'Failed to update balance' });
    }
  }

  // =========================================
  // INTERNAL TRANSFERS - LOCAL ONLY
  // =========================================

  static async createInternalTransfer(req: Request, res: Response) {
    try {
      const { from_account_id, to_account_id, amount, description } = req.body;

      if (!from_account_id || !to_account_id || !amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Invalid transfer parameters' });
      }

      if (from_account_id === to_account_id) {
        return res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
      }

      // Get both accounts
      const fromAccount = await AccountQueries.getAccountWithBalanceDetails(from_account_id);
      const toAccount = await AccountQueries.getAccountWithBalanceDetails(to_account_id);

      if (!fromAccount || !toAccount) {
        return res.status(404).json({ success: false, error: 'One or both accounts not found' });
      }

      if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
        return res.status(400).json({ success: false, error: 'Both accounts must be active' });
      }

      if (fromAccount.currency !== toAccount.currency) {
        return res.status(400).json({ success: false, error: 'Currency mismatch' });
      }

      // Check sufficient funds
      if (fromAccount.available_balance < amount) {
        return res.status(400).json({ success: false, error: 'Insufficient funds' });
      }

      // Perform the transfer atomically
      const pool = (await import('../utils/database')).default;
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Debit from account
        await client.query(
          'UPDATE accounts SET balance = balance - $1, available_balance = available_balance - $1, updated_at = NOW() WHERE id = $2',
          [amount, from_account_id]
        );

        // Credit to account
        await client.query(
          'UPDATE accounts SET balance = balance + $1, available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2',
          [amount, to_account_id]
        );

        // Record transactions
        const debitTransaction = await client.query(
          'INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
          [from_account_id, -amount, fromAccount.currency, 'internal_transfer_debit', 'completed', description || 'Internal transfer']
        );

        const creditTransaction = await client.query(
          'INSERT INTO transactions (account_id, amount, currency, type, status, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id',
          [to_account_id, amount, toAccount.currency, 'internal_transfer_credit', 'completed', description || 'Internal transfer']
        );

        // Record balance changes
        await client.query(
          'INSERT INTO balance_changes (account_id, change_type, previous_balance, new_balance, change_amount, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [from_account_id, 'internal_transfer', fromAccount.balance, fromAccount.balance - amount, -amount, `Transfer to account ${to_account_id}`]
        );

        await client.query(
          'INSERT INTO balance_changes (account_id, change_type, previous_balance, new_balance, change_amount, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [to_account_id, 'internal_transfer', toAccount.balance, toAccount.balance + amount, amount, `Transfer from account ${from_account_id}`]
        );

        await client.query('COMMIT');

        return res.json({
          success: true,
          data: {
            transfer_id: `${debitTransaction.rows[0].id}_${creditTransaction.rows[0].id}`,
            from_account: from_account_id,
            to_account: to_account_id,
            amount: amount,
            currency: fromAccount.currency,
            description: description,
            status: 'completed'
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error: any) {
      logger.error('Internal transfer failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'Transfer failed' });
    }
  }

  // =========================================
  // HEALTH CHECKS
  // =========================================

  static async getLedgerHealth(req: Request, res: Response) {
    try {
      // Check database connectivity
      let dbHealth = false;
      try {
        await AccountQueries.getAllAccounts();
        dbHealth = true;
      } catch (error) {
        dbHealth = false;
      }

      return res.json({
        success: true,
        data: {
          status: dbHealth ? 'healthy' : 'degraded',
          database: dbHealth,
          timestamp: new Date().toISOString(),
          message: 'Ledger health check completed'
        }
      });

    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
      return res.status(500).json({ success: false, error: 'Health check failed' });
    }
  }
}