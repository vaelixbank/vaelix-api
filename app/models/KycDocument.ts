export interface KycDocument {
  id: number;
  user_id: number;
  document_type: string;
  document_url: string;
  status: string;
  uploaded_at: Date;
}

export interface CreateKycDocumentRequest {
  user_id: number;
  document_type: string;
  document_url: string;
}

export interface UpdateKycDocumentRequest {
  status?: string;
}