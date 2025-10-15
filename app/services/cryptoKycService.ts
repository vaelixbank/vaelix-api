import { logger } from '../utils/logger';
import { ISO27001Service } from './iso27001Service';

export interface CryptoKycProfile {
  id: number;
  user_id: number;
  kyc_level: 'basic' | 'intermediate' | 'advanced' | 'vip';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  submitted_at: Date;
  approved_at?: Date;
  expires_at?: Date;
  // Personal information
  full_name: string;
  date_of_birth: Date;
  nationality: string;
  residence_country: string;
  // Documents
  id_document_type: 'passport' | 'id_card' | 'drivers_license';
  id_document_number: string;
  id_document_expiry: Date;
  // Address
  address_line_1: string;
  address_line_2?: string;
  city: string;
  postal_code: string;
  country: string;
  // Financial information
  occupation: string;
  source_of_funds: string;
  annual_income_range: string;
  // Crypto specific
  crypto_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  monthly_crypto_volume: string;
  risk_tolerance: 'low' | 'medium' | 'high';
  // Compliance
  pep_check: boolean;
  sanctions_check: boolean;
  adverse_media_check: boolean;
  risk_score: number;
}

export interface CryptoAmlCheck {
  id: number;
  user_id: number;
  transaction_id?: string;
  check_type: 'transaction' | 'periodic' | 'enhanced';
  status: 'pending' | 'passed' | 'flagged' | 'blocked';
  risk_score: number;
  flags: string[];
  checked_at: Date;
  // Transaction details (if applicable)
  amount?: string;
  asset?: string;
  counterparty?: string;
  // Results
  pep_match: boolean;
  sanctions_match: boolean;
  adverse_media: boolean;
  unusual_pattern: boolean;
  // Actions taken
  actions_taken: string[];
  review_required: boolean;
}

export interface CryptoTransactionMonitoring {
  id: number;
  user_id: number;
  transaction_hash: string;
  blockchain: string;
  amount: string;
  asset: string;
  from_address: string;
  to_address: string;
  risk_score: number;
  monitoring_status: 'normal' | 'flagged' | 'blocked' | 'investigating';
  flagged_reasons: string[];
  created_at: Date;
  last_updated: Date;
}

export class CryptoKycService {
  private static readonly KYC_LEVEL_LIMITS = {
    basic: { daily: 1000, monthly: 10000 },
    intermediate: { daily: 10000, monthly: 50000 },
    advanced: { daily: 50000, monthly: 200000 },
    vip: { daily: Infinity, monthly: Infinity }
  };

  /**
   * Submit KYC application
   */
  static async submitKycApplication(profile: Omit<CryptoKycProfile, 'id' | 'status' | 'submitted_at'>): Promise<CryptoKycProfile> {
    try {
      logger.info('Submitting crypto KYC application', { user_id: profile.user_id });

      // Validate required fields
      this.validateKycData(profile);

      // Perform initial risk assessment
      const riskScore = await this.calculateRiskScore(profile);

      const kycProfile: CryptoKycProfile = {
        ...profile,
        id: Date.now(),
        status: 'pending',
        submitted_at: new Date(),
        risk_score: riskScore,
        pep_check: false,
        sanctions_check: false,
        adverse_media_check: false
      };

      // Perform compliance checks
      await this.performComplianceChecks(kycProfile);

      // Log audit event
      await ISO27001Service.logAuditEvent({
        user_id: profile.user_id,
        action: 'crypto_kyc_submitted',
        resource: 'crypto_kyc',
        resource_id: kycProfile.id.toString(),
        details: { kyc_level: profile.kyc_level, risk_score: riskScore },
        severity: 'medium',
        compliance_status: 'compliant'
      });

      // In production, save to database and trigger manual review if needed

      return kycProfile;
    } catch (error: any) {
      logger.error('KYC submission failed', { error: error.message, user_id: profile.user_id });
      throw error;
    }
  }

  /**
   * Perform AML check on transaction
   */
  static async performAmlCheck(params: {
    user_id: number;
    transaction_id?: string;
    amount: string;
    asset: string;
    counterparty?: string;
    from_address?: string;
    to_address?: string;
  }): Promise<CryptoAmlCheck> {
    try {
      logger.info('Performing crypto AML check', {
        user_id: params.user_id,
        amount: params.amount,
        asset: params.asset
      });

      const flags: string[] = [];
      let riskScore = 0;

      // Amount-based checks
      const amount = parseFloat(params.amount);
      if (amount > 10000) {
        flags.push('high_amount');
        riskScore += 0.3;
      }

      // Asset-based checks
      if (['BTC', 'ETH'].includes(params.asset) && amount > 1) {
        flags.push('high_value_crypto');
        riskScore += 0.2;
      }

      // Counterparty checks (simplified)
      if (params.counterparty) {
        const counterpartyRisk = await this.checkCounterpartyRisk(params.counterparty);
        if (counterpartyRisk.flagged) {
          flags.push(...counterpartyRisk.reasons);
          riskScore += counterpartyRisk.score;
        }
      }

      // Address checks
      if (params.from_address && params.to_address) {
        const addressRisk = await this.checkAddressRisk(params.from_address, params.to_address);
        if (addressRisk.flagged) {
          flags.push(...addressRisk.reasons);
          riskScore += addressRisk.score;
        }
      }

      // Pattern analysis
      const patternRisk = await this.analyzeTransactionPattern(params.user_id, params);
      if (patternRisk.flagged) {
        flags.push(...patternRisk.reasons);
        riskScore += patternRisk.score;
      }

      // Determine status
      let status: 'pending' | 'passed' | 'flagged' | 'blocked' = 'passed';
      if (riskScore > 0.7) {
        status = 'blocked';
      } else if (riskScore > 0.4) {
        status = 'flagged';
      }

      const amlCheck: CryptoAmlCheck = {
        id: Date.now(),
        user_id: params.user_id,
        transaction_id: params.transaction_id,
        check_type: 'transaction',
        status,
        risk_score: riskScore,
        flags,
        checked_at: new Date(),
        amount: params.amount,
        asset: params.asset,
        counterparty: params.counterparty,
        pep_match: flags.includes('pep_match'),
        sanctions_match: flags.includes('sanctions_match'),
        adverse_media: flags.includes('adverse_media'),
        unusual_pattern: flags.includes('unusual_pattern'),
        actions_taken: [],
        review_required: status === 'flagged' || status === 'blocked'
      };

      // Log audit event
      await ISO27001Service.logAuditEvent({
        user_id: params.user_id,
        action: 'crypto_aml_check',
        resource: 'crypto_transaction',
        resource_id: params.transaction_id || 'unknown',
        details: { risk_score: riskScore, flags, status },
        severity: riskScore > 0.4 ? 'high' : 'medium',
        compliance_status: status === 'blocked' ? 'non_compliant' : 'compliant'
      });

      return amlCheck;
    } catch (error: any) {
      logger.error('AML check failed', { error: error.message, params });
      throw error;
    }
  }

  /**
   * Monitor transaction for suspicious activity
   */
  static async monitorTransaction(params: {
    user_id: number;
    transaction_hash: string;
    blockchain: string;
    amount: string;
    asset: string;
    from_address: string;
    to_address: string;
  }): Promise<CryptoTransactionMonitoring> {
    try {
      // Perform risk analysis
      const amlCheck = await this.performAmlCheck({
        user_id: params.user_id,
        amount: params.amount,
        asset: params.asset,
        from_address: params.from_address,
        to_address: params.to_address
      });

      const monitoring: CryptoTransactionMonitoring = {
        id: Date.now(),
        user_id: params.user_id,
        transaction_hash: params.transaction_hash,
        blockchain: params.blockchain,
        amount: params.amount,
        asset: params.asset,
        from_address: params.from_address,
        to_address: params.to_address,
        risk_score: amlCheck.risk_score,
        monitoring_status: amlCheck.status === 'blocked' ? 'blocked' :
                          amlCheck.status === 'flagged' ? 'flagged' : 'normal',
        flagged_reasons: amlCheck.flags,
        created_at: new Date(),
        last_updated: new Date()
      };

      // In production, save to monitoring database and trigger alerts if needed

      return monitoring;
    } catch (error: any) {
      logger.error('Transaction monitoring failed', { error: error.message, params });
      throw error;
    }
  }

  /**
   * Check KYC limits for transaction
   */
  static checkKycLimits(userId: number, kycLevel: string, amount: number, asset: string): {
    allowed: boolean;
    reason?: string;
    remaining_daily?: number;
    remaining_monthly?: number;
  } {
    const limits = this.KYC_LEVEL_LIMITS[kycLevel as keyof typeof this.KYC_LEVEL_LIMITS];

    if (!limits) {
      return { allowed: false, reason: 'Invalid KYC level' };
    }

    // In production, check actual daily/monthly usage from database
    const dailyUsed = 0; // Mock
    const monthlyUsed = 0; // Mock

    const remainingDaily = limits.daily - dailyUsed;
    const remainingMonthly = limits.monthly - monthlyUsed;

    if (amount > remainingDaily) {
      return {
        allowed: false,
        reason: 'Daily limit exceeded',
        remaining_daily: remainingDaily,
        remaining_monthly: remainingMonthly
      };
    }

    if (amount > remainingMonthly) {
      return {
        allowed: false,
        reason: 'Monthly limit exceeded',
        remaining_daily: remainingDaily,
        remaining_monthly: remainingMonthly
      };
    }

    return {
      allowed: true,
      remaining_daily: remainingDaily - amount,
      remaining_monthly: remainingMonthly - amount
    };
  }

  /**
   * Validate KYC data
   */
  private static validateKycData(profile: Partial<CryptoKycProfile>): void {
    const required = ['full_name', 'date_of_birth', 'nationality', 'residence_country',
                     'id_document_type', 'id_document_number', 'id_document_expiry'];

    for (const field of required) {
      if (!profile[field as keyof CryptoKycProfile]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Age validation (must be 18+)
    const age = new Date().getFullYear() - profile.date_of_birth!.getFullYear();
    if (age < 18) {
      throw new Error('User must be at least 18 years old');
    }

    // Document expiry validation
    if (profile.id_document_expiry! < new Date()) {
      throw new Error('ID document has expired');
    }
  }

  /**
   * Calculate risk score for KYC profile
   */
  private static async calculateRiskScore(profile: Partial<CryptoKycProfile>): Promise<number> {
    let score = 0;

    // Country risk
    const highRiskCountries = ['North Korea', 'Iran', 'Venezuela'];
    if (highRiskCountries.includes(profile.residence_country!)) {
      score += 0.5;
    }

    // Experience level
    if (profile.crypto_experience === 'beginner') {
      score += 0.2;
    }

    // Volume expectations
    const monthlyVolume = parseFloat(profile.monthly_crypto_volume || '0');
    if (monthlyVolume > 100000) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Perform compliance checks (PEP, sanctions, etc.)
   */
  private static async performComplianceChecks(profile: CryptoKycProfile): Promise<void> {
    // In production, integrate with compliance services like ComplyAdvantage, Refinitiv, etc.

    // Mock checks
    profile.pep_check = true; // Assume passed
    profile.sanctions_check = true;
    profile.adverse_media_check = true;

    // If any check fails, update status
    if (!profile.pep_check || !profile.sanctions_check || !profile.adverse_media_check) {
      profile.status = 'rejected';
    } else if (profile.risk_score > 0.7) {
      profile.status = 'pending'; // Requires manual review
    } else {
      profile.status = 'approved';
      profile.approved_at = new Date();
      profile.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }
  }

  /**
   * Check counterparty risk
   */
  private static async checkCounterpartyRisk(counterparty: string): Promise<{
    flagged: boolean;
    reasons: string[];
    score: number;
  }> {
    // In production, check against sanctions lists, PEP databases, etc.
    const flaggedAddresses = ['0x123...', '0x456...']; // Mock
    const reasons: string[] = [];
    let score = 0;

    if (flaggedAddresses.includes(counterparty)) {
      reasons.push('sanctions_match');
      score += 0.8;
    }

    return {
      flagged: reasons.length > 0,
      reasons,
      score
    };
  }

  /**
   * Check address risk
   */
  private static async checkAddressRisk(fromAddress: string, toAddress: string): Promise<{
    flagged: boolean;
    reasons: string[];
    score: number;
  }> {
    // In production, check against blockchain analytics services
    const reasons: string[] = [];
    let score = 0;

    // Mock checks
    const riskyAddresses = ['0x789...', '0xabc...'];
    if (riskyAddresses.includes(toAddress)) {
      reasons.push('risky_destination');
      score += 0.6;
    }

    return {
      flagged: reasons.length > 0,
      reasons,
      score
    };
  }

  /**
   * Analyze transaction pattern
   */
  private static async analyzeTransactionPattern(userId: number, params: any): Promise<{
    flagged: boolean;
    reasons: string[];
    score: number;
  }> {
    // In production, analyze historical transaction patterns
    const reasons: string[] = [];
    let score = 0;

    // Mock pattern analysis
    // Check for unusual frequency, amounts, etc.

    return {
      flagged: reasons.length > 0,
      reasons,
      score
    };
  }
}

export const cryptoKycService = new CryptoKycService();