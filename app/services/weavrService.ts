import axios, { AxiosInstance } from 'axios';

export class WeavrService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.WEAVR_API_BASE_URL || 'https://api.weavr.io';
    console.log('WeavrService initialized with baseURL:', baseURL);
    this.client = axios.create({
      baseURL,
      timeout: 30000,
    });
  }

  async makeRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, data?: any, apiKey?: string, authToken?: string) {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (apiKey) {
      headers['api_key'] = apiKey;
    }

    if (authToken) {
      headers['auth_token'] = authToken;
    }

    try {
      const response = await this.client.request({
        method,
        url,
        data,
        headers,
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Weavr API error: ${error.response.status} - ${error.response.data?.message || error.response.data}`);
      }
      throw error;
    }
  }

  // Get card details formatted for wallet addition
  async getCardForWallet(cardId: string, apiKey: string, authToken: string) {
    try {
      const cardData = await this.makeRequest('GET', `/multi/managed_cards/${cardId}`, undefined, apiKey, authToken);

      // Extract and format details for wallet
      const expiryParts = cardData.expiryMmyy ? cardData.expiryMmyy.split('/') : ['', ''];
      const expiryMonth = expiryParts[0] || '';
      const expiryYear = expiryParts[1] ? '20' + expiryParts[1] : '';

      return {
        card_number: cardData.cardNumber?.value || '',
        cvv: cardData.cvv?.value || '',
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        name_on_card: cardData.nameOnCard || ''
      };
    } catch (error: any) {
      throw new Error(`Failed to get card details for wallet: ${error.message}`);
    }
  }
}

export const weavrService = new WeavrService();