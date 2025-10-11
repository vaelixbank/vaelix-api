export interface UserRole {
  id: number;
  user_id: number;
  role_id: number;
  assigned_at: Date;
}

export interface AssignRoleRequest {
  user_id: number;
  role_id: number;
}