export interface FxRates {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: Date;
}

export interface CreateFxRatesRequest {
  from_currency: string;
  to_currency: string;
  rate: number;
}

export interface UpdateFxRatesRequest {
  rate: number;
}