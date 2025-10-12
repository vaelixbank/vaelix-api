"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weavrSyncService = exports.WeavrSyncService = void 0;
const weavrService_1 = require("./weavrService");
const accountQueries_1 = require("../queries/accountQueries");
const userQueries_1 = require("../queries/userQueries");
const cardQueries_1 = require("../queries/cardQueries");
const authQueries_1 = require("../queries/authQueries");
const logger_1 = require("../utils/logger");
class WeavrSyncService {
    constructor(weavrService) {
        this.weavrService = weavrService;
    }
    // =========================================
    // ACCOUNT SYNCHRONIZATION
    // =========================================
    async syncAccountCreation(localAccountId, apiKey, authToken) {
        try {
            logger_1.logger.info('Starting account creation sync', { localAccountId });
            // Get local account data
            const account = await accountQueries_1.AccountQueries.getAccountById(localAccountId);
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
            const weavrResult = await this.weavrService.makeRequest('POST', '/multi/managed_accounts', weavrAccountData, apiKey, authToken);
            // Update local account with Weavr data
            await accountQueries_1.AccountQueries.updateAccountWithWeavrData(localAccountId, {
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
            await authQueries_1.AuthQueries.createAuditLog(account.user_id, 'ACCOUNT_WEAVR_SYNC_SUCCESS', 'account', localAccountId);
            logger_1.logger.info('Account creation sync completed', { localAccountId, weavrId: weavrResult.id });
            return { success: true, weavrId: weavrResult.id };
        }
        catch (error) {
            logger_1.logger.error('Account creation sync failed', { localAccountId, error: error.message });
            // Mark as failed in local DB
            await accountQueries_1.AccountQueries.updateAccountSyncStatus(localAccountId, 'failed', error.message);
            return {
                success: false,
                error: error.message,
                retryable: this.isRetryableError(error)
            };
        }
    }
    async syncAccountBalanceUpdate(accountId, apiKey, authToken) {
        try {
            const account = await accountQueries_1.AccountQueries.getAccountById(accountId);
            if (!account?.weavr_id) {
                return { success: false, error: 'Account not synced with Weavr' };
            }
            // Get current balance from Weavr
            const weavrBalance = await this.weavrService.makeRequest('GET', `/multi/managed_accounts/${account.weavr_id}`, undefined, apiKey, authToken);
            // Update local balance
            await accountQueries_1.AccountQueries.updateAccountBalanceFromWeavr(accountId, {
                balance: weavrBalance.balance?.available + weavrBalance.balance?.blocked + weavrBalance.balance?.reserved || 0,
                available_balance: weavrBalance.balance?.available || 0,
                blocked_balance: weavrBalance.balance?.blocked || 0,
                reserved_balance: weavrBalance.balance?.reserved || 0,
                last_weavr_sync: new Date(),
                sync_status: 'synced'
            });
            return { success: true };
        }
        catch (error) {
            logger_1.logger.error('Balance sync failed', { accountId, error: error.message });
            return { success: false, error: error.message, retryable: true };
        }
    }
    // =========================================
    // CONSUMER/CORPORATE SYNCHRONIZATION
    // =========================================
    async syncConsumerCreation(localConsumerId, apiKey, authToken) {
        try {
            const consumer = await userQueries_1.UserQueries.getConsumerById(localConsumerId);
            if (!consumer) {
                return { success: false, error: 'Consumer not found locally' };
            }
            const weavrData = {
                root_user: consumer.root_user,
                tag: consumer.tag || `consumer_${localConsumerId}`
            };
            const weavrResult = await this.weavrService.makeRequest('POST', '/multi/consumers', weavrData, apiKey, authToken);
            // Update local consumer with Weavr ID
            await userQueries_1.UserQueries.updateConsumerWeavrData(localConsumerId, {
                weavr_id: weavrResult.id,
                last_weavr_sync: new Date(),
                sync_status: 'synced'
            });
            return { success: true, weavrId: weavrResult.id };
        }
        catch (error) {
            logger_1.logger.error('Consumer sync failed', { localConsumerId, error: error.message });
            await userQueries_1.UserQueries.updateConsumerSyncStatus(localConsumerId, 'failed', error.message);
            return { success: false, error: error.message, retryable: this.isRetryableError(error) };
        }
    }
    async syncCorporateCreation(localCorporateId, apiKey, authToken) {
        try {
            const corporate = await userQueries_1.UserQueries.getCorporateById(localCorporateId);
            if (!corporate) {
                return { success: false, error: 'Corporate not found locally' };
            }
            const weavrData = {
                root_user: corporate.root_user,
                company: corporate.company,
                tag: corporate.tag || `corporate_${localCorporateId}`
            };
            const weavrResult = await this.weavrService.makeRequest('POST', '/multi/corporates', weavrData, apiKey, authToken);
            // Update local corporate with Weavr ID
            await userQueries_1.UserQueries.updateCorporateWeavrData(localCorporateId, {
                weavr_id: weavrResult.id,
                last_weavr_sync: new Date(),
                sync_status: 'synced'
            });
            return { success: true, weavrId: weavrResult.id };
        }
        catch (error) {
            logger_1.logger.error('Corporate sync failed', { localCorporateId, error: error.message });
            await userQueries_1.UserQueries.updateCorporateSyncStatus(localCorporateId, 'failed', error.message);
            return { success: false, error: error.message, retryable: this.isRetryableError(error) };
        }
    }
    // =========================================
    // VIRTUAL IBAN (vIBAN) MANAGEMENT
    // =========================================
    async upgradeAccountToIBAN(localAccountId, apiKey, authToken) {
        try {
            logger_1.logger.info('Starting IBAN upgrade for account', { localAccountId });
            // Get local account data
            const account = await accountQueries_1.AccountQueries.getAccountById(localAccountId);
            if (!account) {
                return { success: false, error: 'Account not found locally' };
            }
            if (!account.weavr_id) {
                return { success: false, error: 'Account not synced with Weavr yet' };
            }
            // Check if IBAN already exists
            if (account.iban) {
                logger_1.logger.info('Account already has IBAN', { localAccountId, iban: account.iban });
                return { success: true, weavrId: account.weavr_id };
            }
            // Upgrade account with IBAN
            const ibanResult = await this.weavrService.makeRequest('POST', `/multi/managed_accounts/${account.weavr_id}/iban`, {}, apiKey, authToken);
            // Update local account with IBAN data
            if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
                const ibanDetails = ibanResult.bankAccountDetails[0];
                await accountQueries_1.AccountQueries.updateAccountWithWeavrData(localAccountId, {
                    iban: ibanDetails.details?.iban,
                    bic: ibanDetails.details?.bankIdentifierCode,
                    last_weavr_sync: new Date(),
                    sync_status: ibanResult.state === 'ALLOCATED' ? 'synced' : 'pending_iban'
                });
                logger_1.logger.info('IBAN upgrade completed', {
                    localAccountId,
                    iban: ibanDetails.details?.iban,
                    state: ibanResult.state
                });
            }
            else {
                // IBAN upgrade initiated but not yet allocated
                await accountQueries_1.AccountQueries.updateAccountSyncStatus(localAccountId, 'pending_iban', 'IBAN allocation in progress');
                logger_1.logger.info('IBAN upgrade initiated, waiting for allocation', { localAccountId });
            }
            return { success: true, weavrId: account.weavr_id };
        }
        catch (error) {
            logger_1.logger.error('IBAN upgrade failed', { localAccountId, error: error.message });
            // Mark as failed in local DB
            await accountQueries_1.AccountQueries.updateAccountSyncStatus(localAccountId, 'iban_failed', error.message);
            return {
                success: false,
                error: error.message,
                retryable: this.isRetryableError(error)
            };
        }
    }
    async getAccountIBAN(localAccountId, apiKey, authToken) {
        try {
            // Get local account data
            const account = await accountQueries_1.AccountQueries.getAccountById(localAccountId);
            if (!account?.weavr_id) {
                return null;
            }
            // Get IBAN details from Weavr
            const ibanResult = await this.weavrService.makeRequest('GET', `/multi/managed_accounts/${account.weavr_id}/iban`, undefined, apiKey, authToken);
            // Update local account if IBAN is now available
            if (ibanResult.bankAccountDetails && ibanResult.bankAccountDetails.length > 0) {
                const ibanDetails = ibanResult.bankAccountDetails[0];
                if (ibanDetails.details?.iban && (!account.iban || ibanResult.state === 'ALLOCATED')) {
                    await accountQueries_1.AccountQueries.updateAccountWithWeavrData(localAccountId, {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get account IBAN', { localAccountId, error: error.message });
            return null;
        }
    }
    // =========================================
    // TRANSACTION SYNCHRONIZATION
    // =========================================
    async syncTransaction(localTransactionId, apiKey, authToken) {
        try {
            const transaction = await accountQueries_1.AccountQueries.getTransactionById(localTransactionId);
            if (!transaction) {
                return { success: false, error: 'Transaction not found locally' };
            }
            const account = await accountQueries_1.AccountQueries.getAccountById(transaction.account_id);
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
            const weavrResult = await this.weavrService.makeRequest('POST', '/multi/transfers', weavrTransactionData, apiKey, authToken);
            // Update local transaction with Weavr ID
            await accountQueries_1.AccountQueries.updateTransactionWeavrId(localTransactionId, weavrResult.id);
            return { success: true, weavrId: weavrResult.id };
        }
        catch (error) {
            logger_1.logger.error('Transaction sync failed', { localTransactionId, error: error.message });
            return { success: false, error: error.message, retryable: this.isRetryableError(error) };
        }
    }
    // =========================================
    // WEBHOOK HANDLING
    // =========================================
    async processWebhookEvent(event) {
        try {
            logger_1.logger.info('Processing webhook event', { eventId: event.id, type: event.type });
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
                    logger_1.logger.warn('Unhandled webhook event type', { type: event.type });
            }
            // Mark as processed
            await this.markWebhookProcessed(event.id);
        }
        catch (error) {
            logger_1.logger.error('Webhook processing failed', { eventId: event.id, error: error.message });
            await this.markWebhookFailed(event.id, error.message);
        }
    }
    async handleBalanceUpdate(data) {
        const weavrAccountId = data.id;
        const newBalance = data.balance;
        // Find local account by Weavr ID
        const account = await accountQueries_1.AccountQueries.getAccountByWeavrId(weavrAccountId);
        if (!account) {
            logger_1.logger.warn('Account not found for balance update', { weavrAccountId });
            return;
        }
        // Update local balance
        await accountQueries_1.AccountQueries.updateAccountBalanceFromWeavr(account.id, {
            balance: (newBalance.available || 0) + (newBalance.blocked || 0) + (newBalance.reserved || 0),
            available_balance: newBalance.available || 0,
            blocked_balance: newBalance.blocked || 0,
            reserved_balance: newBalance.reserved || 0,
            last_weavr_sync: new Date(),
            sync_status: 'synced'
        });
        // Record balance change in history
        await accountQueries_1.AccountQueries.recordBalanceChange(account.id, {
            change_type: 'weavr_sync',
            new_balance: account.balance,
            available_new: newBalance.available || 0,
            blocked_new: newBalance.blocked || 0,
            description: 'Balance updated via Weavr webhook'
        });
    }
    async handleAccountStateChange(data) {
        const weavrAccountId = data.id;
        const newState = data.state;
        const account = await accountQueries_1.AccountQueries.getAccountByWeavrId(weavrAccountId);
        if (!account)
            return;
        // Map Weavr states to local states
        const stateMapping = {
            'active': 'active',
            'blocked': 'blocked',
            'closed': 'closed'
        };
        const localState = stateMapping[newState] || 'unknown';
        await accountQueries_1.AccountQueries.updateAccountStatus(account.id, localState);
    }
    async handleTransferStateChange(data) {
        const weavrTransferId = data.id;
        const newState = data.state;
        // Find local transaction by Weavr ID
        const transaction = await accountQueries_1.AccountQueries.getTransactionByWeavrId(weavrTransferId);
        if (!transaction)
            return;
        // Map Weavr states to local states
        const stateMapping = {
            'pending': 'pending',
            'completed': 'completed',
            'failed': 'failed',
            'cancelled': 'cancelled'
        };
        const localState = stateMapping[newState] || 'unknown';
        await accountQueries_1.AccountQueries.updateTransactionStatus(transaction.id, localState);
    }
    async handleCardStateChange(data) {
        const weavrCardId = data.id;
        const newState = data.state;
        const card = await cardQueries_1.CardQueries.getCardByWeavrId(weavrCardId);
        if (!card)
            return;
        const stateMapping = {
            'active': 'active',
            'blocked': 'blocked',
            'destroyed': 'closed'
        };
        const localState = stateMapping[newState] || 'unknown';
        await cardQueries_1.CardQueries.updateCardStatus(card.id, localState);
    }
    // =========================================
    // UTILITY METHODS
    // =========================================
    async storeWebhookEvent(event) {
        // Implementation for storing webhook events in database
        // This would use a new query method
    }
    async markWebhookProcessed(eventId) {
        // Mark webhook as processed
    }
    async markWebhookFailed(eventId, error) {
        // Mark webhook as failed with error
    }
    isRetryableError(error) {
        // Determine if an error is retryable based on error codes
        const retryableCodes = [500, 502, 503, 504, 408, 429];
        return retryableCodes.includes(error.status) ||
            error.message?.includes('timeout') ||
            error.message?.includes('network');
    }
    // =========================================
    // BATCH OPERATIONS
    // =========================================
    async syncPendingEntities(apiKey, authToken) {
        try {
            // Sync pending accounts
            const pendingAccounts = await accountQueries_1.AccountQueries.getPendingSyncAccounts();
            for (const account of pendingAccounts) {
                await this.syncAccountCreation(account.id, apiKey, authToken);
            }
            // Sync pending consumers
            const pendingConsumers = await userQueries_1.UserQueries.getPendingSyncConsumers();
            for (const consumer of pendingConsumers) {
                await this.syncConsumerCreation(consumer.id, apiKey, authToken);
            }
            // Sync pending corporates
            const pendingCorporates = await userQueries_1.UserQueries.getPendingSyncCorporates();
            for (const corporate of pendingCorporates) {
                await this.syncCorporateCreation(corporate.id, apiKey, authToken);
            }
        }
        catch (error) {
            logger_1.logger.error('Batch sync failed', { error: error.message });
        }
    }
}
exports.WeavrSyncService = WeavrSyncService;
exports.weavrSyncService = new WeavrSyncService(new weavrService_1.WeavrService());
