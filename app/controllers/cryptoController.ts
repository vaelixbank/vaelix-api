import { Request, Response } from 'express';
import { ApiResponseHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { CryptoWalletService, cryptoWalletService } from '../services/cryptoWalletService';
import { CryptoExchangeService, cryptoExchangeService } from '../services/cryptoExchangeService';
import { CryptoKycService, cryptoKycService } from '../services/cryptoKycService';
import { ISO27001Service } from '../services/iso27001Service';

export class CryptoController {
  /**
   * Create a new crypto wallet
   */
  async createWallet(req: Request, res: Response) {
    try {
      const { user_id, blockchain, network, label, wallet_type } = req.body;

      if (!user_id || !blockchain) {
        return ApiResponseHandler.error(res, 'user_id and blockchain are required', 'VALIDATION_ERROR', 400);
      }

      const wallet = await CryptoWalletService.createWallet({
        user_id: parseInt(user_id),
        blockchain,
        network: network || 'mainnet',
        label,
        wallet_type: wallet_type || 'hot'
      });

      return ApiResponseHandler.created(res, {
        wallet: {
          id: wallet.id,
          address: wallet.wallet_address,
          blockchain: wallet.blockchain,
          network: wallet.network,
          label: wallet.label,
          is_active: wallet.is_active
        }
      });
    } catch (error: any) {
      logger.error('Wallet creation failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'WALLET_ERROR', 500);
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(req: Request, res: Response) {
    try {
      const { wallet_id } = req.params;

      if (!wallet_id) {
        return ApiResponseHandler.error(res, 'wallet_id is required', 'VALIDATION_ERROR', 400);
      }

      const balances = await CryptoWalletService.getWalletBalance(parseInt(wallet_id));

      return ApiResponseHandler.success(res, { balances });
    } catch (error: any) {
      logger.error('Balance retrieval failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'BALANCE_ERROR', 500);
    }
  }

  /**
   * Send crypto transaction
   */
  async sendTransaction(req: Request, res: Response) {
    try {
      const { from_wallet_id, to_address, asset, amount, gas_price, memo } = req.body;
      const user_id = req.body.user_id || 1; // From auth middleware

      if (!from_wallet_id || !to_address || !asset || !amount) {
        return ApiResponseHandler.error(res, 'from_wallet_id, to_address, asset, and amount are required', 'VALIDATION_ERROR', 400);
      }

      // Validate address
      const wallet = await this.getWalletById(parseInt(from_wallet_id));
      if (!CryptoWalletService.validateAddress(to_address, wallet.blockchain)) {
        return ApiResponseHandler.error(res, 'Invalid destination address', 'VALIDATION_ERROR', 400);
      }

      // Perform AML check
      const amlCheck = await CryptoKycService.performAmlCheck({
        user_id,
        amount,
        asset,
        counterparty: to_address
      });

      if (amlCheck.status === 'blocked') {
        await ISO27001Service.logAuditEvent({
          user_id,
          action: 'crypto_transaction_blocked',
          resource: 'crypto_transaction',
          details: { reason: 'AML check failed', flags: amlCheck.flags },
          severity: 'critical',
          compliance_status: 'non_compliant'
        });
        return ApiResponseHandler.error(res, 'Transaction blocked by AML check', 'AML_BLOCKED', 403);
      }

      // Send transaction
      const transaction = await CryptoWalletService.sendTransaction({
        from_wallet_id: parseInt(from_wallet_id),
        to_address,
        asset,
        amount,
        gas_price,
        memo
      });

      // Monitor transaction
      await CryptoKycService.monitorTransaction({
        user_id,
        transaction_hash: transaction.tx_hash,
        blockchain: transaction.blockchain,
        amount: transaction.amount,
        asset: transaction.asset,
        from_address: transaction.from_address,
        to_address: transaction.to_address
      });

      return ApiResponseHandler.created(res, {
        transaction: {
          id: transaction.id,
          tx_hash: transaction.tx_hash,
          status: transaction.status,
          amount: transaction.amount,
          fee: transaction.fee,
          confirmations: transaction.confirmations
        }
      });
    } catch (error: any) {
      logger.error('Transaction send failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'TRANSACTION_ERROR', 500);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(req: Request, res: Response) {
    try {
      const { wallet_id } = req.params;
      const { limit = 50 } = req.query;

      if (!wallet_id) {
        return ApiResponseHandler.error(res, 'wallet_id is required', 'VALIDATION_ERROR', 400);
      }

      const transactions = await CryptoWalletService.getTransactionHistory(
        parseInt(wallet_id),
        parseInt(limit as string)
      );

      return ApiResponseHandler.success(res, { transactions });
    } catch (error: any) {
      logger.error('Transaction history retrieval failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'HISTORY_ERROR', 500);
    }
  }

  /**
   * Get exchange rates
   */
  async getExchangeRates(req: Request, res: Response) {
    try {
      const { from_asset, to_asset, amount } = req.query as any;

      if (!from_asset || !to_asset) {
        return ApiResponseHandler.error(res, 'from_asset and to_asset are required', 'VALIDATION_ERROR', 400);
      }

      const rates = await CryptoExchangeService.getExchangeRates({
        from_asset,
        to_asset,
        amount
      });

      return ApiResponseHandler.success(res, { rates });
    } catch (error: any) {
      logger.error('Exchange rates retrieval failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'RATES_ERROR', 500);
    }
  }

  /**
   * Buy crypto
   */
  async buyCrypto(req: Request, res: Response) {
    try {
      const { user_id, fiat_currency, fiat_amount, crypto_asset, payment_method } = req.body;

      if (!user_id || !fiat_currency || !fiat_amount || !crypto_asset || !payment_method) {
        return ApiResponseHandler.error(res, 'All fields are required', 'VALIDATION_ERROR', 400);
      }

      const order = await CryptoExchangeService.buyCrypto({
        user_id: parseInt(user_id),
        fiat_currency,
        fiat_amount,
        crypto_asset,
        payment_method
      });

      return ApiResponseHandler.created(res, { order });
    } catch (error: any) {
      logger.error('Crypto buy failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'BUY_ERROR', 500);
    }
  }

  /**
   * Sell crypto
   */
  async sellCrypto(req: Request, res: Response) {
    try {
      const { user_id, crypto_asset, crypto_amount, fiat_currency, wallet_id } = req.body;

      if (!user_id || !crypto_asset || !crypto_amount || !fiat_currency || !wallet_id) {
        return ApiResponseHandler.error(res, 'All fields are required', 'VALIDATION_ERROR', 400);
      }

      const order = await CryptoExchangeService.sellCrypto({
        user_id: parseInt(user_id),
        crypto_asset,
        crypto_amount,
        fiat_currency,
        wallet_id: parseInt(wallet_id)
      });

      return ApiResponseHandler.created(res, { order });
    } catch (error: any) {
      logger.error('Crypto sell failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'SELL_ERROR', 500);
    }
  }

  /**
   * Swap crypto
   */
  async swapCrypto(req: Request, res: Response) {
    try {
      const { user_id, from_asset, to_asset, amount, slippage_tolerance, wallet_id } = req.body;

      if (!user_id || !from_asset || !to_asset || !amount || !wallet_id) {
        return ApiResponseHandler.error(res, 'Required fields missing', 'VALIDATION_ERROR', 400);
      }

      const swap = await CryptoExchangeService.swapCrypto({
        user_id: parseInt(user_id),
        from_asset,
        to_asset,
        amount,
        slippage_tolerance,
        wallet_id: parseInt(wallet_id)
      });

      return ApiResponseHandler.created(res, { swap });
    } catch (error: any) {
      logger.error('Crypto swap failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'SWAP_ERROR', 500);
    }
  }

  /**
   * Submit KYC for crypto
   */
  async submitKyc(req: Request, res: Response) {
    try {
      const kycData = req.body;
      kycData.user_id = req.body.user_id || 1; // From auth

      const kycProfile = await CryptoKycService.submitKycApplication(kycData);

      return ApiResponseHandler.created(res, {
        kyc_profile: {
          id: kycProfile.id,
          status: kycProfile.status,
          kyc_level: kycProfile.kyc_level,
          submitted_at: kycProfile.submitted_at,
          risk_score: kycProfile.risk_score
        }
      });
    } catch (error: any) {
      logger.error('KYC submission failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'KYC_ERROR', 500);
    }
  }

  /**
   * Get supported trading pairs
   */
  async getSupportedPairs(req: Request, res: Response) {
    try {
      const pairs = CryptoExchangeService.getSupportedPairs();
      const fees = CryptoExchangeService.getExchangeFees();

      return ApiResponseHandler.success(res, { pairs, fees });
    } catch (error: any) {
      logger.error('Supported pairs retrieval failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'PAIRS_ERROR', 500);
    }
  }

  /**
   * Validate crypto address
   */
  async validateAddress(req: Request, res: Response) {
    try {
      const { address, blockchain } = req.body;

      if (!address || !blockchain) {
        return ApiResponseHandler.error(res, 'address and blockchain are required', 'VALIDATION_ERROR', 400);
      }

      const isValid = CryptoWalletService.validateAddress(address, blockchain);

      return ApiResponseHandler.success(res, {
        address,
        blockchain,
        valid: isValid
      });
    } catch (error: any) {
      logger.error('Address validation failed', { error: error.message });
      return ApiResponseHandler.error(res, error.message, 'VALIDATION_ERROR', 500);
    }
  }

  /**
   * Helper method to get wallet by ID (mock implementation)
   */
  private async getWalletById(walletId: number): Promise<any> {
    // In production, query database
    return {
      id: walletId,
      blockchain: 'ethereum', // Mock
      network: 'mainnet'
    };
  }
}

export const cryptoController = new CryptoController();