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