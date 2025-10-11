export interface Beneficiary {
  id: string;
  profile_id: string;
  name: string;
  type: 'individual' | 'corporate';
  state: 'active' | 'inactive';
  details: IndividualBeneficiaryDetails | CorporateBeneficiaryDetails;
  created_at: string;
  updated_at: string;
}

export interface IndividualBeneficiaryDetails {
  first_name: string;
  last_name: string;
  address?: Address;
  date_of_birth?: string;
  identification?: {
    type: string;
    number: string;
    country_code: string;
  };
}

export interface CorporateBeneficiaryDetails {
  company_name: string;
  registration_number?: string;
  address?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
}

export interface BeneficiaryBatch {
  id: string;
  profile_id: string;
  state: 'pending' | 'approved' | 'rejected';
  beneficiaries: Beneficiary[];
  created_at: string;
  updated_at: string;
}

export interface CreateBeneficiaryBatchRequest {
  beneficiaries: CreateBeneficiaryRequest[];
}

export interface CreateBeneficiaryRequest {
  name: string;
  type: 'individual' | 'corporate';
  details: IndividualBeneficiaryDetails | CorporateBeneficiaryDetails;
  tag?: string;
}