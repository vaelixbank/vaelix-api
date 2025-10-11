import axios, { AxiosInstance } from 'axios';

export class WeavrService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.WEAVR_API_BASE_URL || 'https://api.weavr.io',
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
}

export const weavrService = new WeavrService();