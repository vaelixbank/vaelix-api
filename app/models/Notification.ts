export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: Date;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: string;
  title: string;
  message: string;
}

export interface UpdateNotificationRequest {
  read?: boolean;
}