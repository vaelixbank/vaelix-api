import { Request, Response, NextFunction } from 'express';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  if (typeof apiKey !== 'string' || apiKey.length < 10) {
    return res.status(401).json({
      error: 'Invalid API key format',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

export const validateAuthToken = (req: Request, res: Response, next: NextFunction) => {
  const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

  if (!authToken) {
    return res.status(401).json({
      error: 'Auth token required',
      code: 'MISSING_AUTH_TOKEN'
    });
  }

  // Remove Bearer prefix if present
  const token = authToken.replace('Bearer ', '');

  if (typeof token !== 'string' || token.length < 10) {
    return res.status(401).json({
      error: 'Invalid auth token format',
      code: 'INVALID_AUTH_TOKEN'
    });
  }

  next();
};

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing_fields: missingFields,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    next();
  };
};

export const validateFieldLength = (field: string, minLength: number, maxLength: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[field];

    if (value && typeof value === 'string') {
      if (value.length < minLength) {
        return res.status(400).json({
          error: `${field} must be at least ${minLength} characters long`,
          code: 'FIELD_TOO_SHORT'
        });
      }

      if (value.length > maxLength) {
        return res.status(400).json({
          error: `${field} must be no more than ${maxLength} characters long`,
          code: 'FIELD_TOO_LONG'
        });
      }
    }

    next();
  };
};

// NASA Security Principle: Input Validation - Comprehensive sanitization to prevent XSS, injection attacks
// Sanitizes all user inputs recursively, escaping dangerous characters and validating formats
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Enhanced input sanitization - escape HTML entities and remove dangerous patterns
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;

    // First, escape HTML entities
    let sanitized = str.replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });

    // Remove potential script injections
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Remove null bytes and other control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  };

  // NASA Security Principle: Defense in Depth - Validate and sanitize all input types
  const sanitizeObject = (obj: any, depth: number = 0): any => {
    // Prevent deep recursion attacks
    if (depth > 10) {
      throw new Error('Input validation failed: maximum depth exceeded');
    }

    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      // Limit array size to prevent DoS
      if (obj.length > 1000) {
        throw new Error('Input validation failed: array too large');
      }
      return obj.map(item => sanitizeObject(item, depth + 1));
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      let keyCount = 0;
      for (const [key, value] of Object.entries(obj)) {
        // Limit object properties to prevent DoS
        if (++keyCount > 100) {
          throw new Error('Input validation failed: too many properties');
        }
        // Sanitize keys as well
        const safeKey = sanitizeString(key);
        sanitized[safeKey] = sanitizeObject(value, depth + 1);
      }
      return sanitized;
    }
    return obj;
  };

  try {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
  } catch (error) {
    // Log sanitization failures for security monitoring
    console.error('Input sanitization failed:', error);
    return res.status(400).json({
      error: 'Invalid input format',
      code: 'INVALID_INPUT'
    });
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateCurrency = (currency: string): boolean => {
  const currencyRegex = /^[A-Z]{3}$/;
  return currencyRegex.test(currency);
};

export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && Number.isFinite(amount);
};

export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// DB Model validations
export const validateUserData = (req: Request, res: Response, next: NextFunction) => {
  const { email, full_name } = req.body;

  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      error: 'Valid email is required',
      code: 'INVALID_EMAIL'
    });
  }

  if (!full_name || typeof full_name !== 'string' || full_name.length < 2) {
    return res.status(400).json({
      error: 'Full name is required and must be at least 2 characters',
      code: 'INVALID_FULL_NAME'
    });
  }

  next();
};

export const validateAccountData = (req: Request, res: Response, next: NextFunction) => {
  const { user_id, currency, balance } = req.body;

  if (!user_id || typeof user_id !== 'number') {
    return res.status(400).json({
      error: 'Valid user_id is required',
      code: 'INVALID_USER_ID'
    });
  }

  if (currency && !validateCurrency(currency)) {
    return res.status(400).json({
      error: 'Currency must be a valid 3-letter code',
      code: 'INVALID_CURRENCY'
    });
  }

  if (balance !== undefined && (typeof balance !== 'number' || balance < 0)) {
    return res.status(400).json({
      error: 'Balance must be a non-negative number',
      code: 'INVALID_BALANCE'
    });
  }

  next();
};

export const validateApiKeyData = (req: Request, res: Response, next: NextFunction) => {
  const { user_id, type, name, expires_at } = req.body;

  if (!user_id || typeof user_id !== 'number') {
    return res.status(400).json({
      error: 'Valid user_id is required',
      code: 'INVALID_USER_ID'
    });
  }

  if (!type || !['client', 'server'].includes(type)) {
    return res.status(400).json({
      error: 'Type must be either "client" or "server"',
      code: 'INVALID_API_KEY_TYPE'
    });
  }

  if (name && (typeof name !== 'string' || name.length > 50)) {
    return res.status(400).json({
      error: 'Name must be a string with maximum 50 characters',
      code: 'INVALID_API_KEY_NAME'
    });
  }

  if (expires_at && isNaN(Date.parse(expires_at))) {
    return res.status(400).json({
      error: 'expires_at must be a valid date',
      code: 'INVALID_EXPIRATION_DATE'
    });
  }

  next();
};

export const validatePassword = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      error: 'Password is required',
      code: 'MISSING_PASSWORD'
    });
  }

  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Password does not meet security requirements',
      code: 'WEAK_PASSWORD',
      details: validation.errors
    });
  }

  next();
};

// Banking validations
export const validateIBAN = (iban: string): boolean => {
  try {
    // Remove spaces and convert to uppercase
    const cleanIBAN = iban.replace(/\s+/g, '').toUpperCase();

    // Basic format check
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(cleanIBAN)) {
      return false;
    }

    // Move first 4 characters to end
    const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);

    // Convert letters to numbers (A=10, B=11, etc.)
    const numericIBAN = rearranged.split('').map(char => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    }).join('');

    // Checksum validation using modulo 97
    const checksum = BigInt(numericIBAN) % 97n;
    return checksum === 1n;
  } catch (error) {
    return false;
  }
};

export const validateBIC = (bic: string): boolean => {
  // BIC format: 8 or 11 characters
  // XXXXYYZZ or XXXXYYZZZZZ where:
  // XXXX = Bank code
  // YY = Country code
  // ZZ/ZZZZZ = Location code
  const bicRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  return bicRegex.test(bic.replace(/\s+/g, '').toUpperCase());
};

export const validateSWIFTMessageType = (messageType: string): boolean => {
  const validTypes = ['MT103', 'MT202', 'MT103STP', 'pacs008', 'pacs009'];
  return validTypes.includes(messageType);
};

export const validateSEPAScheme = (scheme: string): boolean => {
  return ['SCT', 'SDD'].includes(scheme);
};

export const validateChargeBearer = (bearer: string): boolean => {
  return ['SHA', 'OUR', 'BEN'].includes(bearer);
};

// ISO Standards validations
export const validateCurrencyISO4217 = (currency: string): boolean => {
  // ISO 4217 currency codes (3-letter codes)
  const validCurrencies = [
    'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
    'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV',
    'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHE', 'CHF',
    'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUC', 'CUP', 'CVE',
    'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD',
    'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD',
    'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK',
    'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD',
    'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL',
    'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN',
    'MXV', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR',
    'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD',
    'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE',
    'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS',
    'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD',
    'USN', 'UYI', 'UYU', 'UYW', 'UZS', 'VED', 'VES', 'VND', 'VUV', 'WST',
    'XAF', 'XAG', 'XAU', 'XBA', 'XBB', 'XBC', 'XBD', 'XCD', 'XDR', 'XOF',
    'XPD', 'XPF', 'XPT', 'XSU', 'XTS', 'XUA', 'XXX', 'YER', 'ZAR', 'ZMW',
    'ZWL'
  ];
  return validCurrencies.includes(currency.toUpperCase());
};

export const validateCountryISO3166 = (country: string): boolean => {
  // ISO 3166-1 alpha-2 country codes (2-letter codes)
  const validCountries = [
    'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT',
    'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI',
    'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY',
    'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
    'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
    'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'EU', 'FI', 'FJ',
    'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI',
    'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK',
    'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ',
    'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM',
    'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR',
    'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH',
    'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV',
    'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO',
    'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL',
    'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU',
    'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL',
    'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD',
    'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV',
    'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG',
    'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
  ];
  return validCountries.includes(country.toUpperCase());
};

export const validateBICCountry = (bic: string): boolean => {
  // Extract country code from BIC (positions 5-6)
  if (bic.length < 6) return false;
  const countryCode = bic.substring(4, 6);
  return validateCountryISO3166(countryCode);
};

export const validateIBANCountry = (iban: string): boolean => {
  // Extract country code from IBAN (first 2 characters)
  if (iban.length < 2) return false;
  const countryCode = iban.substring(0, 2);
  return validateCountryISO3166(countryCode);
};