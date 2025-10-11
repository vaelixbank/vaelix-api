export interface WealthPortfolio {
  id: number;
  user_id: number;
  portfolio_name: string;
  total_value: number;
  created_at: Date;
}

export interface CreateWealthPortfolioRequest {
  user_id: number;
  portfolio_name: string;
  total_value?: number;
}

export interface UpdateWealthPortfolioRequest {
  portfolio_name?: string;
  total_value?: number;
}