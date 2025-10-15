export interface CryptoWallet {
  id: number;
  user_id: number;
  wallet_address: string;
  blockchain: string; // 'bitcoin', 'ethereum', 'polygon', etc.
  network: string; // 'mainnet', 'testnet', 'goerli', etc.
  label?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Security
  encrypted_private_key?: string; // Only for hot wallets (encrypted)
  multisig_required?: boolean;
  multisig_threshold?: number;
  // Balances
  balances: CryptoBalance[];
  // Settings
  whitelisted_addresses?: string[];
  daily_limit?: number;
  monthly_limit?: number;
}

export interface CryptoBalance {
  id: number;
  wallet_id: number;
  asset: string; // 'BTC', 'ETH', 'USDT', etc.
  balance: string; // BigDecimal as string to avoid precision issues
  available_balance: string;
  locked_balance: string;
  last_sync: Date;
  contract_address?: string; // For ERC-20 tokens
}

export interface CryptoTransaction {
  id: number;
  wallet_id: number;
  tx_hash: string;
  blockchain: string;
  from_address: string;
  to_address: string;
  asset: string;
  amount: string;
  fee: string;
  gas_price?: string;
  gas_limit?: string;
  block_number?: number;
  block_hash?: string;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed' | 'dropped';
  transaction_type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'bridge';
  timestamp: Date;
  memo?: string;
  // Compliance
  risk_score?: number;
  compliance_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  regulatory_reference?: string;
}

export interface CryptoExchange {
  id: number;
  user_id: number;
  exchange_name: string; // 'binance', 'coinbase', 'kraken', etc.
  api_key_encrypted: string;
  api_secret_encrypted: string;
  is_active: boolean;
  last_sync: Date;
  // Limits and settings
  daily_withdrawal_limit?: number;
  trading_enabled: boolean;
  // Balances from exchange
  exchange_balances: ExchangeBalance[];
}

export interface ExchangeBalance {
  id: number;
  exchange_id: number;
  asset: string;
  free: string;
  locked: string;
  total: string;
  last_update: Date;
}

export interface CryptoExchangeRate {
  id: number;
  from_asset: string;
  to_asset: string;
  rate: string;
  source: string; // 'coinmarketcap', 'coingecko', 'exchange'
  timestamp: Date;
  // Fee information
  maker_fee?: string;
  taker_fee?: string;
  min_order?: string;
}

export interface CryptoSwap {
  id: number;
  user_id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  from_asset: string;
  to_asset: string;
  from_amount: string;
  to_amount: string;
  exchange_rate: string;
  fee: string;
  fee_asset: string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'cancelled';
  tx_hash?: string;
  executed_at?: Date;
  // DEX information (if applicable)
  dex_contract?: string;
  slippage_tolerance?: string;
  deadline?: number;
}

export interface CryptoStaking {
  id: number;
  user_id: number;
  wallet_id: number;
  asset: string;
  amount: string;
  validator_address?: string;
  staking_provider: string; // 'lido', 'rocketpool', 'binance', etc.
  apr: string;
  lock_period_days?: number;
  rewards_earned: string;
  status: 'active' | 'unstaking' | 'unstaked';
  start_date: Date;
  end_date?: Date;
  // Rewards
  auto_compound: boolean;
  last_reward_claim: Date;
}

export interface CryptoBridge {
  id: number;
  user_id: number;
  from_chain: string;
  to_chain: string;
  from_wallet_id: number;
  to_wallet_id: number;
  asset: string;
  amount: string;
  bridge_provider: string; // 'polygon-bridge', 'arbitrum-bridge', etc.
  fee: string;
  estimated_completion: Date;
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  tx_hash_from?: string;
  tx_hash_to?: string;
  bridge_tx_hash?: string;
}

// Request/Response interfaces
export interface CreateCryptoWalletRequest {
  user_id: number;
  blockchain: string;
  network: string;
  label?: string;
  wallet_type: 'hot' | 'cold' | 'custodial';
}

export interface CryptoTransferRequest {
  from_wallet_id: number;
  to_address: string;
  asset: string;
  amount: string;
  gas_price?: string;
  memo?: string;
}

export interface CryptoSwapRequest {
  user_id: number;
  from_asset: string;
  to_asset: string;
  amount: string;
  slippage_tolerance?: string;
  dex_preference?: string;
}

export interface CryptoStakingRequest {
  user_id: number;
  wallet_id: number;
  asset: string;
  amount: string;
  staking_provider: string;
  lock_period_days?: number;
}