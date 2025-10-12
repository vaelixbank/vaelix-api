import { Request, Response } from 'express';
import { WeavrService } from '../services/weavrService';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { parseWeavrError, getWeavrErrorStatus } from '../utils/weavr';
import { CreateManagedAccountRequest, UpdateManagedAccountRequest } from '../models/Account';

export class WeavrAccountController {
  constructor(private weavrService: WeavrService) {}

  async getAllAccounts(req: Request, res: Response) {
    try {
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', '/multi/managed_accounts', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        '/multi/managed_accounts',
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', '/multi/managed_accounts', 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', '/multi/managed_accounts', error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async createAccount(req: Request, res: Response) {
    try {
      const accountData: CreateManagedAccountRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', '/multi/managed_accounts', req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        '/multi/managed_accounts',
        accountData,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', '/multi/managed_accounts', 201, req.headers['x-request-id'] as string);

      return ApiResponseHandler.created(res, result);
    } catch (error: any) {
      logger.weavrError('POST', '/multi/managed_accounts', error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${req.params.id}`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('GET', `/multi/managed_accounts/${req.params.id}`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async updateAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateManagedAccountRequest = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('PATCH', `/multi/managed_accounts/${req.params.id}`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'PATCH',
        `/multi/managed_accounts/${req.params.id}`,
        updateData,
        apiKey,
        authToken
      );

      logger.weavrResponse('PATCH', `/multi/managed_accounts/${req.params.id}`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('PATCH', `/multi/managed_accounts/${req.params.id}`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async blockAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/block`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/block`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/block`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/block`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async unblockAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/unblock`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/unblock`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/unblock`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getAccountStatement(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}/statement`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${req.params.id}/statement`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}/statement`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async upgradeAccountWithIBAN(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/iban`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/iban`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/iban`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async getAccountIBAN(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('GET', `/multi/managed_accounts/${req.params.id}/iban`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${req.params.id}/iban`,
        undefined,
        apiKey,
        authToken
      );

      logger.weavrResponse('GET', `/multi/managed_accounts/${req.params.id}/iban`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async removeAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      logger.weavrRequest('POST', `/multi/managed_accounts/${req.params.id}/remove`, req.headers['x-request-id'] as string);

      const result = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${req.params.id}/remove`,
        req.body,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${req.params.id}/remove`, 200, req.headers['x-request-id'] as string);

      return ApiResponseHandler.success(res, result);
    } catch (error: any) {
      logger.weavrError('POST', `/multi/managed_accounts/${req.params.id}/unblock`, error, req.headers['x-request-id'] as string);

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }

  async createMasterAccount(req: Request, res: Response) {
    try {
      const { profile_id, user_id, account_name = 'Master Account', currency = 'EUR' } = req.body;
      const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
      const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

      if (!profile_id || !user_id) {
        return ApiResponseHandler.error(res, 'profile_id and user_id are required', 'VALIDATION_ERROR', 400);
      }

      logger.info('Creating master account', { profile_id, user_id, account_name });

      // Step 1: Create account in local database
      const { AccountQueries } = await import('../queries/accountQueries');
      const localAccount = await AccountQueries.createAccount(
        user_id,
        '', // account_number (empty for master)
        'master', // account_type
        currency,
        0, // initial balance
        'active'
      );

      // Step 2: Create Weavr managed account
      const weavrAccountData = {
        profile_id,
        name: account_name,
        tag: `master_${localAccount.id}`
      };

      logger.weavrRequest('POST', '/multi/managed_accounts', req.headers['x-request-id'] as string);

      const weavrResult = await this.weavrService.makeRequest(
        'POST',
        '/multi/managed_accounts',
        weavrAccountData,
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', '/multi/managed_accounts', 201, req.headers['x-request-id'] as string);

      // Step 3: Update local account with Weavr data
      await AccountQueries.updateAccountWithWeavrData(localAccount.id, {
        weavr_id: weavrResult.id,
        last_weavr_sync: new Date(),
        sync_status: 'synced'
      });

      // Update weavr_profile_id and account_name separately
      const pool = (await import('../utils/database')).default;
      await pool.query(
        'UPDATE accounts SET weavr_profile_id = $1, account_name = $2 WHERE id = $3',
        [profile_id, account_name, localAccount.id]
      );

      // Step 4: Upgrade to vIBAN
      logger.weavrRequest('POST', `/multi/managed_accounts/${weavrResult.id}/iban`, req.headers['x-request-id'] as string);

      const ibanResult = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${weavrResult.id}/iban`,
        {},
        apiKey,
        authToken
      );

      logger.weavrResponse('POST', `/multi/managed_accounts/${weavrResult.id}/iban`, 200, req.headers['x-request-id'] as string);

      // Update local account with IBAN if available
      if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
        const ibanDetails = ibanResult.bankAccountDetails[0];
        await AccountQueries.updateAccountWithWeavrData(localAccount.id, {
          iban: ibanDetails.details?.iban,
          bic: ibanDetails.details?.bankIdentifierCode,
          sync_status: ibanResult.state === 'ALLOCATED' ? 'synced' : 'pending_iban'
        });
      }

      // Step 5: Set initial balance of 1000 billion EUR in local ledger
      const initialBalance = 1000000000000; // 1000 billion EUR
      await AccountQueries.updateAccountBalance(localAccount.id, initialBalance);

      // Record balance change
      await AccountQueries.recordBalanceChange(localAccount.id, {
        change_type: 'initial_deposit',
        previous_balance: 0,
        new_balance: initialBalance,
        change_amount: initialBalance,
        description: 'Initial master account balance setup'
      });

      // Get final account data
      const finalAccount = await AccountQueries.getAccountWithBalanceDetails(localAccount.id);

      return ApiResponseHandler.created(res, {
        local_account: finalAccount,
        weavr_account: weavrResult,
        iban_upgrade: ibanResult,
        initial_balance_set: initialBalance
      });

    } catch (error: any) {
      logger.error('Master account creation failed', { error: error.message });

      const weavrError = parseWeavrError(error);
      return ApiResponseHandler.error(
        res,
        weavrError.message,
        weavrError.code,
        getWeavrErrorStatus(weavrError),
        weavrError.details
      );
    }
  }
}