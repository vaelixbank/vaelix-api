import crypto from 'crypto';
import { logger } from '../utils/logger';
import { CryptoExchangeRate, CryptoSwap } from '../models/CryptoWallet';

export interface ExchangeRateRequest {
  from_asset: string;
  to_asset: string;
  amount?: string;
}

export interface ExchangeRateResponse {
  from_asset: string;
  to_asset: string;
  rate: string;
  amount?: string;
  converted_amount?: string;
  fee: string;
  source: string;
  timestamp: Date;
  slippage?: string;
}

export interface CryptoBuyRequest {
  user_id: number;
  fiat_currency: string;
  fiat_amount: string;
  crypto_asset: string;
  payment_method: 'bank_transfer' | 'card' | 'wallet';
}

export interface CryptoSellRequest {
  user_id: number;
  crypto_asset: string;
  crypto_amount: string;
  fiat_currency: string;
  wallet_id: number;
}

export class CryptoExchangeService {
  private static readonly SUPPORTED_FIAT = ['EUR', 'USD', 'GBP', 'CHF'];
  private static readonly SUPPORTED_CRYPTO = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOT', 'MATIC'];
  private static readonly EXCHANGE_FEE_PERCENTAGE = 0.005; // 0.5%
  private static readonly MIN_EXCHANGE_AMOUNT = 10; // EUR
  private static readonly MAX_EXCHANGE_AMOUNT = 100000; // EUR

  /**
   * Get current exchange rates
   */
  static async getExchangeRates(request: ExchangeRateRequest): Promise<ExchangeRateResponse> {
    try {
      logger.info('Getting exchange rates', request);

      // In production, fetch from multiple sources (CoinMarketCap, CoinGecko, etc.)
      const mockRate = await this.getMockExchangeRate(request.from_asset, request.to_asset);

      let convertedAmount: string | undefined;
      if (request.amount) {
        const amount = parseFloat(request.amount);
        convertedAmount = (amount * parseFloat(mockRate.rate)).toFixed(8);
      }

      const fee = request.amount ?
        (parseFloat(request.amount) * this.EXCHANGE_FEE_PERCENTAGE).toFixed(2) : '0';

      return {
        from_asset: request.from_asset,
        to_asset: request.to_asset,
        rate: mockRate.rate,
        amount: request.amount,
        converted_amount: convertedAmount,
        fee,
        source: 'coinmarketcap',
        timestamp: new Date(),
        slippage: '0.5'
      };
    } catch (error: any) {
      logger.error('Exchange rate retrieval failed', { error: error.message, request });
      throw error;
    }
  }

  /**
   * Mock exchange rate (in production, use real APIs)
   */
  private static async getMockExchangeRate(fromAsset: string, toAsset: string): Promise<{ rate: string }> {
    // Mock rates (in production, fetch from APIs)
    const rates: Record<string, Record<string, string>> = {
      'EUR': { 'BTC': '0.000025', 'ETH': '0.0005', 'BNB': '0.002' },
      'USD': { 'BTC': '0.000027', 'ETH': '0.00055', 'BNB': '0.0022' },
      'BTC': { 'EUR': '40000', 'USD': '37000', 'ETH': '16.5' },
      'ETH': { 'EUR': '2400', 'USD': '2200', 'BTC': '0.06' }
    };

    const rate = rates[fromAsset]?.[toAsset] || '1.0';
    return { rate };
  }

  /**
   * Buy crypto with fiat
   */
  static async buyCrypto(request: CryptoBuyRequest): Promise<{
    order_id: string;
    expected_crypto_amount: string;
    fiat_amount: string;
    fee: string;
    exchange_rate: string;
    payment_instructions: any;
    status: string;
  }> {
    try {
      logger.info('Processing crypto buy order', {
        user_id: request.user_id,
        fiat_amount: request.fiat_amount,
        crypto_asset: request.crypto_asset
      });

      // Validate request
      this.validateBuyRequest(request);

      // Get current exchange rate
      const rateResponse = await this.getExchangeRates({
        from_asset: request.fiat_currency,
        to_asset: request.crypto_asset,
        amount: request.fiat_amount
      });

      const fiatAmount = parseFloat(request.fiat_amount);
      const fee = fiatAmount * this.EXCHANGE_FEE_PERCENTAGE;
      const netAmount = fiatAmount - fee;
      const expectedCryptoAmount = (netAmount * parseFloat(rateResponse.rate)).toString();

      // Create order
      const order = {
        order_id: `BUY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        expected_crypto_amount: expectedCryptoAmount,
        fiat_amount: request.fiat_amount,
        fee: fee.toFixed(2),
        exchange_rate: rateResponse.rate,
        payment_instructions: this.generatePaymentInstructions(request),
        status: 'pending_payment'
      };

      // In production, save order to database and initiate payment flow

      return order;
    } catch (error: any) {
      logger.error('Crypto buy failed', { error: error.message, request });
      throw error;
    }
  }

  /**
   * Sell crypto for fiat
   */
  static async sellCrypto(request: CryptoSellRequest): Promise<{
    order_id: string;
    expected_fiat_amount: string;
    crypto_amount: string;
    fee: string;
    exchange_rate: string;
    wallet_address: string;
    status: string;
  }> {
    try {
      logger.info('Processing crypto sell order', {
        user_id: request.user_id,
        crypto_amount: request.crypto_amount,
        fiat_currency: request.fiat_currency
      });

      // Validate request
      this.validateSellRequest(request);

      // Get current exchange rate
      const rateResponse = await this.getExchangeRates({
        from_asset: request.crypto_asset,
        to_asset: request.fiat_currency,
        amount: request.crypto_amount
      });

      const cryptoAmount = parseFloat(request.crypto_amount);
      const expectedFiatAmount = (cryptoAmount * parseFloat(rateResponse.rate)).toString();
      const fee = parseFloat(expectedFiatAmount) * this.EXCHANGE_FEE_PERCENTAGE;

      // Create order
      const order = {
        order_id: `SELL-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        expected_fiat_amount: (parseFloat(expectedFiatAmount) - fee).toFixed(2),
        crypto_amount: request.crypto_amount,
        fee: fee.toFixed(2),
        exchange_rate: rateResponse.rate,
        wallet_address: '0x1234567890abcdef...', // In production, get from wallet service
        status: 'pending_deposit'
      };

      // In production, save order and wait for crypto deposit

      return order;
    } catch (error: any) {
      logger.error('Crypto sell failed', { error: error.message, request });
      throw error;
    }
  }

  /**
   * Swap crypto to crypto
   */
  static async swapCrypto(request: {
    user_id: number;
    from_asset: string;
    to_asset: string;
    amount: string;
    slippage_tolerance?: string;
    wallet_id: number;
  }): Promise<CryptoSwap> {
    try {
      logger.info('Processing crypto swap', request);

      // Get exchange rate
      const rateResponse = await this.getExchangeRates({
        from_asset: request.from_asset,
        to_asset: request.to_asset,
        amount: request.amount
      });

      const fromAmount = parseFloat(request.amount);
      const toAmount = fromAmount * parseFloat(rateResponse.rate);
      const fee = toAmount * this.EXCHANGE_FEE_PERCENTAGE;

      const swap: CryptoSwap = {
        id: Date.now(),
        user_id: request.user_id,
        from_wallet_id: request.wallet_id,
        to_wallet_id: request.wallet_id, // Same wallet for simplicity
        from_asset: request.from_asset,
        to_asset: request.to_asset,
        from_amount: request.amount,
        to_amount: (toAmount - fee).toFixed(8),
        exchange_rate: rateResponse.rate,
        fee: fee.toFixed(8),
        fee_asset: request.to_asset,
        status: 'pending',
        dex_contract: '0x123...', // Uniswap, SushiSwap, etc.
        slippage_tolerance: request.slippage_tolerance || '0.5'
      };

      // In production, execute on DEX
      // For demo, mark as completed
      swap.status = 'completed';
      swap.executed_at = new Date();
      swap.tx_hash = '0x' + crypto.randomBytes(32).toString('hex');

      return swap;
    } catch (error: any) {
      logger.error('Crypto swap failed', { error: error.message, request });
      throw error;
    }
  }

  /**
   * Get supported trading pairs
   */
  static getSupportedPairs(): { fiat: string[]; crypto: string[]; pairs: string[] } {
    const pairs: string[] = [];
    this.SUPPORTED_FIAT.forEach(fiat => {
      this.SUPPORTED_CRYPTO.forEach(crypto => {
        pairs.push(`${fiat}/${crypto}`);
        pairs.push(`${crypto}/${fiat}`);
      });
    });

    // Add crypto-to-crypto pairs
    this.SUPPORTED_CRYPTO.forEach(from => {
      this.SUPPORTED_CRYPTO.forEach(to => {
        if (from !== to) {
          pairs.push(`${from}/${to}`);
        }
      });
    });

    return {
      fiat: this.SUPPORTED_FIAT,
      crypto: this.SUPPORTED_CRYPTO,
      pairs
    };
  }

  /**
   * Validate buy request
   */
  private static validateBuyRequest(request: CryptoBuyRequest): void {
    if (!this.SUPPORTED_FIAT.includes(request.fiat_currency)) {
      throw new Error(`Unsupported fiat currency: ${request.fiat_currency}`);
    }

    if (!this.SUPPORTED_CRYPTO.includes(request.crypto_asset)) {
      throw new Error(`Unsupported crypto asset: ${request.crypto_asset}`);
    }

    const amount = parseFloat(request.fiat_amount);
    if (amount < this.MIN_EXCHANGE_AMOUNT || amount > this.MAX_EXCHANGE_AMOUNT) {
      throw new Error(`Amount must be between ${this.MIN_EXCHANGE_AMOUNT} and ${this.MAX_EXCHANGE_AMOUNT} ${request.fiat_currency}`);
    }

    const allowedPaymentMethods = ['bank_transfer', 'card', 'wallet'];
    if (!allowedPaymentMethods.includes(request.payment_method)) {
      throw new Error(`Unsupported payment method: ${request.payment_method}`);
    }
  }

  /**
   * Validate sell request
   */
  private static validateSellRequest(request: CryptoSellRequest): void {
    if (!this.SUPPORTED_CRYPTO.includes(request.crypto_asset)) {
      throw new Error(`Unsupported crypto asset: ${request.crypto_asset}`);
    }

    if (!this.SUPPORTED_FIAT.includes(request.fiat_currency)) {
      throw new Error(`Unsupported fiat currency: ${request.fiat_currency}`);
    }

    const amount = parseFloat(request.crypto_amount);
    if (amount <= 0) {
      throw new Error('Crypto amount must be positive');
    }
  }

  /**
   * Generate payment instructions
   */
  private static generatePaymentInstructions(request: CryptoBuyRequest): any {
    switch (request.payment_method) {
      case 'bank_transfer':
        return {
          type: 'bank_transfer',
          iban: 'BE12345678901234',
          bic: 'VAELBE21',
          beneficiary: 'Vaelix Bank Crypto Services',
          reference: `BUY-${Date.now()}`,
          amount: request.fiat_amount,
          currency: request.fiat_currency
        };
      case 'card':
        return {
          type: 'card_payment',
          gateway: 'stripe', // In production, integrate with payment processor
          amount: request.fiat_amount,
          currency: request.fiat_currency
        };
      case 'wallet':
        return {
          type: 'wallet_transfer',
          wallet_address: '0x1234567890abcdef...',
          amount: request.fiat_amount,
          currency: request.fiat_currency
        };
      default:
        throw new Error(`Unsupported payment method: ${request.payment_method}`);
    }
  }

  /**
   * Get exchange fees
   */
  static getExchangeFees(): {
    percentage: number;
    min_amount: number;
    max_amount: number;
    supported_fiat: string[];
    supported_crypto: string[];
  } {
    return {
      percentage: this.EXCHANGE_FEE_PERCENTAGE,
      min_amount: this.MIN_EXCHANGE_AMOUNT,
      max_amount: this.MAX_EXCHANGE_AMOUNT,
      supported_fiat: this.SUPPORTED_FIAT,
      supported_crypto: this.SUPPORTED_CRYPTO
    };
  }
}

export const cryptoExchangeService = new CryptoExchangeService();