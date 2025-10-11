export interface VbgNode {
  id: number;
  node_name: string;
  location: string;
  status: string;
  created_at: Date;
}

export interface CreateVbgNodeRequest {
  node_name: string;
  location: string;
  status?: string;
}

export interface UpdateVbgNodeRequest {
  status?: string;
}