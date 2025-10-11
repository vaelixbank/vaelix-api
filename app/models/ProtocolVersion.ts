export interface ProtocolVersion {
  id: number;
  version: string;
  description?: string;
  released_at?: Date;
}

export interface CreateProtocolVersionRequest {
  version: string;
  description?: string;
  released_at?: Date;
}

export interface UpdateProtocolVersionRequest {
  description?: string;
  released_at?: Date;
}