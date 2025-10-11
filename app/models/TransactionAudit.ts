export interface TransactionAudit {
  id: number;
  transaction_id: number;
  action: string;
  performed_by: number;
  timestamp: Date;
}

export interface CreateTransactionAuditRequest {
  transaction_id: number;
  action: string;
  performed_by: number;
}