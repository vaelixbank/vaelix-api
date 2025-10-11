export interface AuthFactor {
  id: string;
  type: 'otp' | 'push';
  state: 'active' | 'inactive';
  created_at: string;
  last_used_at?: string;
}

export interface SCAChallenge {
  id: string;
  type: 'step_up' | 'confirmation';
  method: 'otp' | 'push';
  state: 'pending' | 'completed' | 'expired' | 'failed';
  expires_at: string;
  created_at: string;
  completed_at?: string;
}

export interface StepUpChallengeRequest {
  resource_type: string;
  resource_id: string;
  action: string;
}

export interface ConfirmationChallengeRequest {
  resources: Array<{
    type: string;
    id: string;
  }>;
}

export interface SCAChallengeResponse {
  challenge_id: string;
  method: 'otp' | 'push';
  expires_at: string;
}

export interface SCAVerifyRequest {
  challenge_id: string;
  verification_code?: string;
  biometric_token?: string;
}

export interface SCAVerifyResponse {
  verified: boolean;
  token?: string;
}

export interface EnrolOTPRequest {
  mobile_number: {
    number: string;
    country_code: string;
  };
}

export interface EnrolOTPResponse {
  enrolment_id: string;
  expires_at: string;
}

export interface VerifyOTPEnrolmentRequest {
  enrolment_id: string;
  verification_code: string;
}

export interface EnrolPushRequest {
  device_id: string;
  device_name: string;
}