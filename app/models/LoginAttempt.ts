export interface LoginAttempt {
  id: number;
  user_id: number;
  ip_address: string;
  success: boolean;
  attempted_at: Date;
}

export interface CreateLoginAttemptRequest {
  user_id: number;
  ip_address: string;
  success: boolean;
}