export interface LedgerSnapshot {
  id: number;
  snapshot_date: Date;
  total_balance: number;
}

export interface CreateLedgerSnapshotRequest {
  total_balance: number;
}