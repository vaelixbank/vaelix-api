// ============================================
// Vaelix Bank API - Open Banking Controller
// ============================================
// Berlin Group API compliant endpoints
// ============================================

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/apiKeyAuth';
import {
  OpenBankingAccount,
  OpenBankingBalance,
  OpenBankingTransaction,
  OpenBankingConsent,
  OpenBankingPaymentInitiation,
  OpenBankingPaymentStatus,
  OpenBankingFundsConfirmation,
  OpenBankingResponse,
  OpenBankingError,
  BaaSCustomer,
  BaaSAccount,
  BaaSCard,
  BaaSTransaction
} from '../models/OpenBanking';
import { OpenBankingService } from '../services/openBankingService';
import { BaaSService } from '../services/baasService';

export class OpenBankingController {
  private openBankingService: OpenBankingService;
  private baasService: BaaSService;

  constructor() {
    this.openBankingService = new OpenBankingService();
    this.baasService = new BaaSService();
  }

  // ============================================
  // Account Information Service (AIS) Endpoints
  // ============================================

  /**
   * GET /accounts - Get list of accounts
   */
  async getAccounts(req: AuthenticatedRequest, res: Response) {
    try {
      const consentId = req.headers['consent-id'] as string;
      const withBalance = req.query.withBalance === 'true';

      if (!consentId) {
        return this.sendError(res, 400, 'CONSENT_ID_MISSING', 'Consent ID is required');
      }

      const accounts = await this.openBankingService.getAccounts(consentId, withBalance);

      const response: OpenBankingResponse<OpenBankingAccount[]> = {
        data: accounts,
        _links: {
          self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error getting accounts:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve accounts');
    }
  }

  /**
   * GET /accounts/{accountId} - Get account details
   */
  async getAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const consentId = req.headers['consent-id'] as string;
      const withBalance = req.query.withBalance === 'true';

      if (!consentId) {
        return this.sendError(res, 400, 'CONSENT_ID_MISSING', 'Consent ID is required');
      }

      const account = await this.openBankingService.getAccount(accountId, consentId, withBalance);

      if (!account) {
        return this.sendError(res, 404, 'ACCOUNT_NOT_FOUND', 'Account not found');
      }

      const response: OpenBankingResponse<OpenBankingAccount> = {
        data: account,
        _links: {
          self: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          balances: `${req.protocol}://${req.get('host')}/accounts/${accountId}/balances`,
          transactions: `${req.protocol}://${req.get('host')}/accounts/${accountId}/transactions`
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error getting account:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve account');
    }
  }

  /**
   * GET /accounts/{accountId}/balances - Get account balances
   */
  async getBalances(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const consentId = req.headers['consent-id'] as string;

      if (!consentId) {
        return this.sendError(res, 400, 'CONSENT_ID_MISSING', 'Consent ID is required');
      }

      const balances = await this.openBankingService.getBalances(accountId, consentId);

      const response: OpenBankingResponse<OpenBankingBalance[]> = {
        data: balances,
        _links: {
          self: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          account: `${req.protocol}://${req.get('host')}/accounts/${accountId}`
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error getting balances:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve balances');
    }
  }

  /**
   * GET /accounts/{accountId}/transactions - Get account transactions
   */
  async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const consentId = req.headers['consent-id'] as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!consentId) {
        return this.sendError(res, 400, 'CONSENT_ID_MISSING', 'Consent ID is required');
      }

      const transactions = await this.openBankingService.getTransactions(
        accountId,
        consentId,
        { dateFrom, dateTo, limit }
      );

      const response: OpenBankingResponse<OpenBankingTransaction[]> = {
        data: transactions,
        _links: {
          self: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          account: `${req.protocol}://${req.get('host')}/accounts/${accountId}`
        }
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error getting transactions:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve transactions');
    }
  }

  // ============================================
  // Payment Initiation Service (PIS) Endpoints
  // ============================================

  /**
   * POST /payments/{paymentProduct} - Initiate payment
   */
  async initiatePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentProduct } = req.params;
      const paymentData: OpenBankingPaymentInitiation = req.body;
      const tppId = req.headers['tpp-id'] as string;
      const psuId = req.headers['psu-id'] as string;

      if (!tppId) {
        return this.sendError(res, 400, 'TPP_ID_MISSING', 'TPP ID is required');
      }

      const payment = await this.openBankingService.initiatePayment(
        paymentProduct,
        paymentData,
        tppId,
        psuId
      );

      res.status(201).json({
        paymentId: payment.paymentId,
        transactionStatus: payment.transactionStatus,
        _links: {
          self: `${req.protocol}://${req.get('host')}/payments/${paymentProduct}/${payment.paymentId}`,
          status: `${req.protocol}://${req.get('host')}/payments/${paymentProduct}/${payment.paymentId}/status`
        }
      });
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to initiate payment');
    }
  }

  /**
   * GET /payments/{paymentProduct}/{paymentId} - Get payment details
   */
  async getPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentProduct, paymentId } = req.params;
      const tppId = req.headers['tpp-id'] as string;

      if (!tppId) {
        return this.sendError(res, 400, 'TPP_ID_MISSING', 'TPP ID is required');
      }

      const payment = await this.openBankingService.getPayment(paymentId, tppId);

      if (!payment) {
        return this.sendError(res, 404, 'PAYMENT_NOT_FOUND', 'Payment not found');
      }

      res.json(payment);
    } catch (error: any) {
      console.error('Error getting payment:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve payment');
    }
  }

  /**
   * GET /payments/{paymentProduct}/{paymentId}/status - Get payment status
   */
  async getPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { paymentProduct, paymentId } = req.params;
      const tppId = req.headers['tpp-id'] as string;

      if (!tppId) {
        return this.sendError(res, 400, 'TPP_ID_MISSING', 'TPP ID is required');
      }

      const status = await this.openBankingService.getPaymentStatus(paymentId, tppId);

      if (!status) {
        return this.sendError(res, 404, 'PAYMENT_NOT_FOUND', 'Payment not found');
      }

      res.json(status);
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve payment status');
    }
  }

  // ============================================
  // Confirmation of Funds (PIIS) Endpoints
  // ============================================

  /**
   * POST /funds-confirmations - Check funds availability
   */
  async checkFunds(req: AuthenticatedRequest, res: Response) {
    try {
      const fundsRequest: OpenBankingFundsConfirmation = req.body;
      const consentId = req.headers['consent-id'] as string;

      if (!consentId) {
        return this.sendError(res, 400, 'CONSENT_ID_MISSING', 'Consent ID is required');
      }

      const result = await this.openBankingService.checkFunds(fundsRequest, consentId);

      res.json(result);
    } catch (error: any) {
      console.error('Error checking funds:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to check funds availability');
    }
  }

  // ============================================
  // Consent Management Endpoints
  // ============================================

  /**
   * POST /consents - Create consent
   */
  async createConsent(req: AuthenticatedRequest, res: Response) {
    try {
      const consentRequest = req.body;
      const tppId = req.headers['tpp-id'] as string;
      const psuId = req.headers['psu-id'] as string;

      if (!tppId) {
        return this.sendError(res, 400, 'TPP_ID_MISSING', 'TPP ID is required');
      }

      const consent = await this.openBankingService.createConsent(consentRequest, tppId, psuId);

      res.status(201).json({
        consentId: consent.consentId,
        consentStatus: consent.consentStatus,
        _links: {
          self: `${req.protocol}://${req.get('host')}/consents/${consent.consentId}`,
          status: `${req.protocol}://${req.get('host')}/consents/${consent.consentId}/status`
        }
      });
    } catch (error: any) {
      console.error('Error creating consent:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create consent');
    }
  }

  /**
   * GET /consents/{consentId} - Get consent details
   */
  async getConsent(req: AuthenticatedRequest, res: Response) {
    try {
      const { consentId } = req.params;
      const tppId = req.headers['tpp-id'] as string;

      if (!tppId) {
        return this.sendError(res, 400, 'TPP_ID_MISSING', 'TPP ID is required');
      }

      const consent = await this.openBankingService.getConsent(consentId, tppId);

      if (!consent) {
        return this.sendError(res, 404, 'CONSENT_NOT_FOUND', 'Consent not found');
      }

      res.json(consent);
    } catch (error: any) {
      console.error('Error getting consent:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve consent');
    }
  }

  /**
   * DELETE /consents/{consentId} - Revoke consent
   */
  async revokeConsent(req: AuthenticatedRequest, res: Response) {
    try {
      const { consentId } = req.params;
      const tppId = req.headers['tpp-id'] as string;

      if (!tppId) {
        return this.sendError(res, 400, 'TPP_ID_MISSING', 'TPP ID is required');
      }

      await this.openBankingService.revokeConsent(consentId, tppId);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error revoking consent:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to revoke consent');
    }
  }

  // ============================================
  // BaaS (Banking as a Service) Endpoints
  // ============================================

  /**
   * POST /baas/customers - Create BaaS customer
   */
  async createBaaSCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const customerData: Partial<BaaSCustomer> = req.body;

      const customer = await this.baasService.createCustomer(customerData);

      res.status(201).json({
        customerId: customer.customerId,
        status: customer.status,
        kycStatus: customer.kycStatus,
        _links: {
          self: `${req.protocol}://${req.get('host')}/baas/customers/${customer.customerId}`,
          accounts: `${req.protocol}://${req.get('host')}/baas/customers/${customer.customerId}/accounts`
        }
      });
    } catch (error: any) {
      console.error('Error creating BaaS customer:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create customer');
    }
  }

  /**
   * GET /baas/customers/{customerId} - Get BaaS customer
   */
  async getBaaSCustomer(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;

      const customer = await this.baasService.getCustomer(customerId);

      if (!customer) {
        return this.sendError(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
      }

      res.json(customer);
    } catch (error: any) {
      console.error('Error getting BaaS customer:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve customer');
    }
  }

  /**
   * POST /baas/customers/{customerId}/accounts - Create BaaS account
   */
  async createBaaSAccount(req: AuthenticatedRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const accountData: Partial<BaaSAccount> = req.body;

      const account = await this.baasService.createAccount(customerId, accountData);

      res.status(201).json({
        accountId: account.accountId,
        iban: account.iban,
        status: account.status,
        _links: {
          self: `${req.protocol}://${req.get('host')}/baas/accounts/${account.accountId}`,
          customer: `${req.protocol}://${req.get('host')}/baas/customers/${customerId}`,
          transactions: `${req.protocol}://${req.get('host')}/baas/accounts/${account.accountId}/transactions`
        }
      });
    } catch (error: any) {
      console.error('Error creating BaaS account:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create account');
    }
  }

  /**
   * POST /baas/accounts/{accountId}/transactions - Create transaction
   */
  async createBaaSTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const { accountId } = req.params;
      const transactionData: Partial<BaaSTransaction> = req.body;

      const transaction = await this.baasService.createTransaction(accountId, transactionData);

      res.status(201).json({
        transactionId: transaction.transactionId,
        status: transaction.status,
        _links: {
          self: `${req.protocol}://${req.get('host')}/baas/transactions/${transaction.transactionId}`,
          account: `${req.protocol}://${req.get('host')}/baas/accounts/${accountId}`
        }
      });
    } catch (error: any) {
      console.error('Error creating BaaS transaction:', error);
      this.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create transaction');
    }
  }

  // ============================================
  // Utility Methods
  // ============================================

  private sendError(res: Response, statusCode: number, errorCode: string, message: string, details?: any) {
    const error: OpenBankingError = {
      type: `https://api.vaelixbank.com/errors/${errorCode.toLowerCase()}`,
      title: errorCode,
      detail: message,
      instance: res.req?.originalUrl
    };

    if (details) {
      error.additionalErrors = [{
        title: 'Additional Information',
        detail: JSON.stringify(details)
      }];
    }

    res.status(statusCode).json({ error });
  }
}