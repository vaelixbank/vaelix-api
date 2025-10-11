export interface Approval {
  id: number;
  transaction_id: number;
  approver_id: number;
  approved: boolean;
  approved_at?: Date;
}

export interface CreateApprovalRequest {
  transaction_id: number;
  approver_id: number;
}

export interface UpdateApprovalRequest {
  approved: boolean;
}