export interface SupportTicket {
  id: number;
  user_id: number;
  title: string;
  message: string;
  status: string;
  created_at: Date;
}

export interface CreateSupportTicketRequest {
  user_id: number;
  title: string;
  message: string;
}

export interface UpdateSupportTicketRequest {
  status?: string;
}