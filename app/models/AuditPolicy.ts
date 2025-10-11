export interface AuditPolicy {
  id: number;
  policy_name: string;
  description?: string;
  created_at: Date;
}

export interface CreateAuditPolicyRequest {
  policy_name: string;
  description?: string;
}

export interface UpdateAuditPolicyRequest {
  description?: string;
}