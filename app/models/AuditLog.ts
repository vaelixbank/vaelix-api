export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  object_type: string;
  object_id: number;
  timestamp: Date;
}

export interface CreateAuditLogRequest {
  user_id: number;
  action: string;
  object_type: string;
  object_id: number;
}