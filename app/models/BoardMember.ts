export interface BoardMember {
  id: number;
  full_name: string;
  position: string;
  joined_at: Date;
  status: string;
}

export interface CreateBoardMemberRequest {
  full_name: string;
  position: string;
  joined_at: Date;
  status?: string;
}

export interface UpdateBoardMemberRequest {
  position?: string;
  status?: string;
}