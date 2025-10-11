export interface InsuranceContract {
  id: number;
  user_id: number;
  policy_number: string;
  coverage_amount: number;
  status: string;
  start_date: Date;
  end_date: Date;
}

export interface CreateInsuranceContractRequest {
  user_id: number;
  policy_number: string;
  coverage_amount: number;
  status?: string;
  start_date: Date;
  end_date: Date;
}

export interface UpdateInsuranceContractRequest {
  coverage_amount?: number;
  status?: string;
  end_date?: Date;
}