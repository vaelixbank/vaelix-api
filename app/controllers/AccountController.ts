import { Request, Response } from 'express';
import { AccountQueries } from '../queries/accountQueries';

interface CreateAccountRequest {
  user_id: number;
  account_number: string;
  account_type: string;
  currency?: string;
  balance?: number;
  status?: string;
}

interface UpdateAccountRequest {
  account_number?: string;
  account_type?: string;
  balance?: number;
  status?: string;
}

export class AccountController {
  static async getAllAccounts(req: Request, res: Response) {
    try {
      // For admin purposes - get all accounts
      // This would need a separate query in AccountQueries
      res.status(501).json({ error: 'Not implemented yet' });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAccountById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await AccountQueries.getAccountById(parseInt(id));

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json(account);
    } catch (error) {
      console.error('Error fetching account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await AccountQueries.getAccountById(parseInt(id));

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json({
        account_id: account.id,
        balance: account.balance,
        currency: account.currency,
        last_updated: account.updated_at
      });
    } catch (error) {
      console.error('Error fetching account balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAccountsByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const accounts = await AccountQueries.getUserAccounts(parseInt(userId));
      res.json(accounts);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createAccount(req: Request, res: Response) {
    try {
      const { user_id, account_number, account_type, currency = 'EUR', balance = 0, status = 'active' }: CreateAccountRequest = req.body;

      const account = await AccountQueries.createAccount(user_id, account_number, account_type, currency, balance, status);

      res.status(201).json(account);
    } catch (error: any) {
      console.error('Error creating account:', error);
      if (error.code === '23505') {
        res.status(409).json({ error: 'Account number already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  static async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { account_number, account_type, balance, status }: UpdateAccountRequest = req.body;

      const account = await AccountQueries.updateAccountStatus(parseInt(id), status || 'active');

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json(account);
    } catch (error) {
      console.error('Error updating account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { amount }: { amount: number } = req.body;

      if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount must be a number' });
      }

      const account = await AccountQueries.updateAccountBalance(parseInt(id), amount);

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json({
        account_id: account.id,
        new_balance: account.balance,
        currency: account.currency,
        updated_at: account.updated_at
      });
    } catch (error) {
      console.error('Error updating account balance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async closeAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const account = await AccountQueries.updateAccountStatus(parseInt(id), 'closed');

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      res.json({ message: 'Account closed successfully' });
    } catch (error) {
      console.error('Error closing account:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAccountTransactions(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const transactions = await AccountQueries.getAccountTransactions(parseInt(id), limit, offset);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}