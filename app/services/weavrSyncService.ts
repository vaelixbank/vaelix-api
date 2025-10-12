import { WeavrService } from './weavrService';
import { AccountQueries } from '../queries/accountQueries';
import { UserQueries } from '../queries/userQueries';
import { CardQueries } from '../queries/cardQueries';
import { AuthQueries } from '../queries/authQueries';
import { logger } from '../utils/logger';

export interface SyncResult {
  success: boolean;
  weavrId?: string;
  error?: string;
  retryable?: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export class WeavrSyncService {
  private weavrService: WeavrService;

  constructor(weavrService: WeavrService) {
    this.weavrService = weavrService;
  }

  // =========================================
  // ACCOUNT SYNCHRONIZATION
  // =========================================

  async syncAccountCreation(localAccountId: number, apiKey: string, authToken: string): Promise<SyncResult> {
    try {
      logger.info('Starting account creation sync', { localAccountId });

      // Get local account data
      const account = await AccountQueries.getAccountById(localAccountId);
      if (!account) {
        return { success: false, error: 'Account not found locally' };
      }

      // Prepare Weavr account data
      const weavrAccountData = {
        profile_id: account.weavr_profile_id,
        name: account.account_name || `Account ${account.id}`,
        tag: `local_${account.id}`
      };

      // Create account in Weavr
      const weavrResult = await this.weavrService.makeRequest(
        'POST',
        '/multi/managed_accounts',
        weavrAccountData,
        apiKey,
        authToken
      );

      // Update local account with Weavr data
      await AccountQueries.updateAccountWithWeavrData(localAccountId, {
        weavr_id: weavrResult.id,
        iban: weavrResult.iban,
        bic: weavrResult.bic,
        available_balance: weavrResult.balance?.available || 0,
        blocked_balance: weavrResult.balance?.blocked || 0,
        reserved_balance: weavrResult.balance?.reserved || 0,
        last_weavr_sync: new Date(),
        sync_status: 'synced'
      });

      // Log successful sync
      await AuthQueries.createAuditLog(
        account.user_id,
        'ACCOUNT_WEAVR_SYNC_SUCCESS',
        'account',
        localAccountId
      );

      logger.info('Account creation sync completed', { localAccountId, weavrId: weavrResult.id });
      return { success: true, weavrId: weavrResult.id };

    } catch (error: any) {
      logger.error('Account creation sync failed', { localAccountId, error: error.message });

      // Mark as failed in local DB
      await AccountQueries.updateAccountSyncStatus(localAccountId, 'failed', error.message);

      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  async syncAccountBalanceUpdate(accountId: number, apiKey: string, authToken: string): Promise<SyncResult> {
    try {
      const account = await AccountQueries.getAccountById(accountId);
      if (!account?.weavr_id) {
        return { success: false, error: 'Account not synced with Weavr' };
      }

      // Get current balance from Weavr
      const weavrBalance = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${account.weavr_id}`,
        undefined,
        apiKey,
        authToken
      );

      // Update local balance
      await AccountQueries.updateAccountBalanceFromWeavr(accountId, {
        balance: weavrBalance.balance?.available + weavrBalance.balance?.blocked + weavrBalance.balance?.reserved || 0,
        available_balance: weavrBalance.balance?.available || 0,
        blocked_balance: weavrBalance.balance?.blocked || 0,
        reserved_balance: weavrBalance.balance?.reserved || 0,
        last_weavr_sync: new Date(),
        sync_status: 'synced'
      });

      return { success: true };

    } catch (error: any) {
      logger.error('Balance sync failed', { accountId, error: error.message });
      return { success: false, error: error.message, retryable: true };
    }
  }

  // =========================================
  // CONSUMER/CORPORATE SYNCHRONIZATION
  // =========================================

  async syncConsumerCreation(localConsumerId: string, apiKey: string, authToken: string): Promise<SyncResult> {
    try {
      const consumer = await UserQueries.getConsumerById(localConsumerId);
      if (!consumer) {
        return { success: false, error: 'Consumer not found locally' };
      }

      const weavrData = {
        root_user: consumer.root_user,
        tag: consumer.tag || `consumer_${localConsumerId}`
      };

      const weavrResult = await this.weavrService.makeRequest(
        'POST',
        '/multi/consumers',
        weavrData,
        apiKey,
        authToken
      );

      // Update local consumer with Weavr ID
      await UserQueries.updateConsumerWeavrData(localConsumerId, {
        weavr_id: weavrResult.id,
        last_weavr_sync: new Date(),
        sync_status: 'synced'
      });

      return { success: true, weavrId: weavrResult.id };

    } catch (error: any) {
      logger.error('Consumer sync failed', { localConsumerId, error: error.message });
      await UserQueries.updateConsumerSyncStatus(localConsumerId, 'failed', error.message);
      return { success: false, error: error.message, retryable: this.isRetryableError(error) };
    }
  }

  async syncCorporateCreation(localCorporateId: string, apiKey: string, authToken: string): Promise<SyncResult> {
    try {
      const corporate = await UserQueries.getCorporateById(localCorporateId);
      if (!corporate) {
        return { success: false, error: 'Corporate not found locally' };
      }

      const weavrData = {
        root_user: corporate.root_user,
        company: corporate.company,
        tag: corporate.tag || `corporate_${localCorporateId}`
      };

      const weavrResult = await this.weavrService.makeRequest(
        'POST',
        '/multi/corporates',
        weavrData,
        apiKey,
        authToken
      );

      // Update local corporate with Weavr ID
      await UserQueries.updateCorporateWeavrData(localCorporateId, {
        weavr_id: weavrResult.id,
        last_weavr_sync: new Date(),
        sync_status: 'synced'
      });

      return { success: true, weavrId: weavrResult.id };

    } catch (error: any) {
      logger.error('Corporate sync failed', { localCorporateId, error: error.message });
      await UserQueries.updateCorporateSyncStatus(localCorporateId, 'failed', error.message);
      return { success: false, error: error.message, retryable: this.isRetryableError(error) };
    }
  }

  // =========================================
  // VIRTUAL IBAN (vIBAN) MANAGEMENT
  // =========================================

  async upgradeAccountToIBAN(localAccountId: number, apiKey: string, authToken: string): Promise<SyncResult> {
    try {
      logger.info('Starting IBAN upgrade for account', { localAccountId });

      // Get local account data
      const account = await AccountQueries.getAccountById(localAccountId);
      if (!account) {
        return { success: false, error: 'Account not found locally' };
      }

      if (!account.weavr_id) {
        return { success: false, error: 'Account not synced with Weavr yet' };
      }

      // Check if IBAN already exists
      if (account.iban) {
        logger.info('Account already has IBAN', { localAccountId, iban: account.iban });
        return { success: true, weavrId: account.weavr_id };
      }

      // Upgrade account with IBAN
      const ibanResult = await this.weavrService.makeRequest(
        'POST',
        `/multi/managed_accounts/${account.weavr_id}/iban`,
        {},
        apiKey,
        authToken
      );

      // Update local account with IBAN data
      if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
        const ibanDetails = ibanResult.bankAccountDetails[0];
        await AccountQueries.updateAccountWithWeavrData(localAccountId, {
          iban: ibanDetails.details?.iban,
          bic: ibanDetails.details?.bankIdentifierCode,
          last_weavr_sync: new Date(),
          sync_status: ibanResult.state === 'ALLOCATED' ? 'synced' : 'pending_iban'
        });

        logger.info('IBAN upgrade completed', {
          localAccountId,
          iban: ibanDetails.details?.iban,
          state: ibanResult.state
        });
      } else {
        // IBAN upgrade initiated but not yet allocated
        await AccountQueries.updateAccountSyncStatus(localAccountId, 'pending_iban', 'IBAN allocation in progress');
        logger.info('IBAN upgrade initiated, waiting for allocation', { localAccountId });
      }

      return { success: true, weavrId: account.weavr_id };

    } catch (error: any) {
      logger.error('IBAN upgrade failed', { localAccountId, error: error.message });

      // Mark as failed in local DB
      await AccountQueries.updateAccountSyncStatus(localAccountId, 'iban_failed', error.message);

      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  async getAccountIBAN(localAccountId: number, apiKey: string, authToken: string): Promise<{ iban?: string; bic?: string; state: string } | null> {
    try {
      // Get local account data
      const account = await AccountQueries.getAccountById(localAccountId);
      if (!account?.weavr_id) {
        return null;
      }

      // Get IBAN details from Weavr
      const ibanResult = await this.weavrService.makeRequest(
        'GET',
        `/multi/managed_accounts/${account.weavr_id}/iban`,
        undefined,
        apiKey,
        authToken
      );

      // Update local account if IBAN is now available
      if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
        const ibanDetails = ibanResult.bankAccountDetails[0];
        if (ibanDetails.details?.iban && (!account.iban || ibanResult.state === 'ALLOCATED')) {
          await AccountQueries.updateAccountWithWeavrData(localAccountId, {
            iban: ibanDetails.details.iban,
            bic: ibanDetails.details.bankIdentifierCode,
            last_weavr_sync: new Date(),
            sync_status: ibanResult.state === 'ALLOCATED' ? 'synced' : 'pending_iban'
          });
        }

        return {
          iban: ibanDetails.details?.iban,
          bic: ibanDetails.details?.bankIdentifierCode,
          state: ibanResult.state
        };
      }

      return { state: ibanResult.state };

    } catch (error: any) {
      logger.error('Failed to get account IBAN', { localAccountId, error: error.message });
      return null;
    }
  }

  // =========================================
  // TRANSACTION SYNCHRONIZATION
  // =========================================

  async syncTransaction(localTransactionId: number, apiKey: string, authToken: string): Promise<SyncResult> {
    try {
      const transaction = await AccountQueries.getTransactionById(localTransactionId);
      if (!transaction) {
        return { success: false, error: 'Transaction not found locally' };
      }

      const account = await AccountQueries.getAccountById(transaction.account_id);
      if (!account?.weavr_id) {
        return { success: false, error: 'Account not synced with Weavr' };
      }

      // Prepare transaction data for Weavr
      const weavrTransactionData = {
        source: {
          type: 'managed_account',
          id: account.weavr_id
        },
        destination: transaction.destination_data, // This needs to be structured properly
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description
      };

      const weavrResult = await this.weavrService.makeRequest(
        'POST',
        '/multi/transfers',
        weavrTransactionData,
        apiKey,
        authToken
      );

      // Update local transaction with Weavr ID
      await AccountQueries.updateTransactionWeavrId(localTransactionId, weavrResult.id);

      return { success: true, weavrId: weavrResult.id };

    } catch (error: any) {
      logger.error('Transaction sync failed', { localTransactionId, error: error.message });
      return { success: false, error: error.message, retryable: this.isRetryableError(error) };
    }
  }

  // =========================================
  // WEBHOOK HANDLING
  // =========================================

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      logger.info('Processing webhook event', { eventId: event.id, type: event.type });

      // Store webhook event
      await this.storeWebhookEvent(event);

      // Process based on event type
      switch (event.type) {
        case 'managed_account.balance.updated':
          await this.handleBalanceUpdate(event.data);
          break;
        case 'managed_account.state.changed':
          await this.handleAccountStateChange(event.data);
          break;
        case 'transfer.state.changed':
          await this.handleTransferStateChange(event.data);
          break;
        case 'managed_card.state.changed':
          await this.handleCardStateChange(event.data);
          break;
        default:
          logger.warn('Unhandled webhook event type', { type: event.type });
      }

      // Mark as processed
      await this.markWebhookProcessed(event.id);

    } catch (error: any) {
      logger.error('Webhook processing failed', { eventId: event.id, error: error.message });
      await this.markWebhookFailed(event.id, error.message);
    }
  }

  private async handleBalanceUpdate(data: any): Promise<void> {
    const weavrAccountId = data.id;
    const newBalance = data.balance;

    // Find local account by Weavr ID
    const account = await AccountQueries.getAccountByWeavrId(weavrAccountId);
    if (!account) {
      logger.warn('Account not found for balance update', { weavrAccountId });
      return;
    }

    // Update local balance
    await AccountQueries.updateAccountBalanceFromWeavr(account.id, {
      balance: (newBalance.available || 0) + (newBalance.blocked || 0) + (newBalance.reserved || 0),
      available_balance: newBalance.available || 0,
      blocked_balance: newBalance.blocked || 0,
      reserved_balance: newBalance.reserved || 0,
      last_weavr_sync: new Date(),
      sync_status: 'synced'
    });

    // Record balance change in history
    await AccountQueries.recordBalanceChange(account.id, {
      change_type: 'weavr_sync',
      new_balance: account.balance,
      available_new: newBalance.available || 0,
      blocked_new: newBalance.blocked || 0,
      description: 'Balance updated via Weavr webhook'
    });
  }

  private async handleAccountStateChange(data: any): Promise<void> {
    const weavrAccountId = data.id;
    const newState = data.state;

    const account = await AccountQueries.getAccountByWeavrId(weavrAccountId);
    if (!account) return;

    // Map Weavr states to local states
    const stateMapping: { [key: string]: string } = {
      'active': 'active',
      'blocked': 'blocked',
      'closed': 'closed'
    };

    const localState = stateMapping[newState] || 'unknown';
    await AccountQueries.updateAccountStatus(account.id, localState);
  }

  private async handleTransferStateChange(data: any): Promise<void> {
    const weavrTransferId = data.id;
    const newState = data.state;

    // Find local transaction by Weavr ID
    const transaction = await AccountQueries.getTransactionByWeavrId(weavrTransferId);
    if (!transaction) return;

    // Map Weavr states to local states
    const stateMapping: { [key: string]: string } = {
      'pending': 'pending',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled'
    };

    const localState = stateMapping[newState] || 'unknown';
    await AccountQueries.updateTransactionStatus(transaction.id, localState);
  }

  private async handleCardStateChange(data: any): Promise<void> {
    const weavrCardId = data.id;
    const newState = data.state;

    const card = await CardQueries.getCardByWeavrId(weavrCardId);
    if (!card) return;

    const stateMapping: { [key: string]: string } = {
      'active': 'active',
      'blocked': 'blocked',
      'destroyed': 'closed'
    };

    const localState = stateMapping[newState] || 'unknown';
    await CardQueries.updateCardStatus(card.id, localState);
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  private async storeWebhookEvent(event: WebhookEvent): Promise<void> {
    // Implementation for storing webhook events in database
    // This would use a new query method
  }

  private async markWebhookProcessed(eventId: string): Promise<void> {
    // Mark webhook as processed
  }

  private async markWebhookFailed(eventId: string, error: string): Promise<void> {
    // Mark webhook as failed with error
  }

  private isRetryableError(error: any): boolean {
    // Determine if an error is retryable based on error codes
    const retryableCodes = [500, 502, 503, 504, 408, 429];
    return retryableCodes.includes(error.status) ||
           error.message?.includes('timeout') ||
           error.message?.includes('network');
  }

  // =========================================
  // BATCH OPERATIONS
  // =========================================

  async syncPendingEntities(apiKey: string, authToken: string): Promise<void> {
    try {
      // Sync pending accounts
      const pendingAccounts = await AccountQueries.getPendingSyncAccounts();
      for (const account of pendingAccounts) {
        await this.syncAccountCreation(account.id, apiKey, authToken);
      }

      // Sync pending consumers
      const pendingConsumers = await UserQueries.getPendingSyncConsumers();
      for (const consumer of pendingConsumers) {
        await this.syncConsumerCreation(consumer.id, apiKey, authToken);
      }

      // Sync pending corporates
      const pendingCorporates = await UserQueries.getPendingSyncCorporates();
      for (const corporate of pendingCorporates) {
        await this.syncCorporateCreation(corporate.id, apiKey, authToken);
      }

    } catch (error: any) {
      logger.error('Batch sync failed', { error: error.message });
    }
  }
}

export const weavrSyncService = new WeavrSyncService(new WeavrService());