// Utility functions to mask sensitive data in logs and responses

export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '***';
  return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return local.substring(0, 2) + '***' + '@' + domain;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 6) return phone;
  return phone.substring(0, 3) + '***' + phone.substring(phone.length - 3);
};

export const maskIBAN = (iban: string): string => {
  if (!iban || iban.length < 8) return iban;
  return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
};

export const maskCardNumber = (cardNumber: string): string => {
  if (!cardNumber || cardNumber.length < 8) return cardNumber;
  return cardNumber.substring(0, 4) + ' **** **** ' + cardNumber.substring(cardNumber.length - 4);
};

export const maskObject = (obj: any, fieldsToMask: string[]): any => {
  if (!obj || typeof obj !== 'object') return obj;

  const masked = { ...obj };

  for (const field of fieldsToMask) {
    if (masked[field]) {
      if (field.toLowerCase().includes('email')) {
        masked[field] = maskEmail(masked[field]);
      } else if (field.toLowerCase().includes('phone')) {
        masked[field] = maskPhone(masked[field]);
      } else if (field.toLowerCase().includes('iban')) {
        masked[field] = maskIBAN(masked[field]);
      } else if (field.toLowerCase().includes('card')) {
        masked[field] = maskCardNumber(masked[field]);
      } else if (field.toLowerCase().includes('key') || field.toLowerCase().includes('token') || field.toLowerCase().includes('secret')) {
        masked[field] = maskApiKey(masked[field]);
      } else {
        // Generic masking for other sensitive fields
        masked[field] = '***masked***';
      }
    }
  }

  return masked;
};

export const maskHeaders = (headers: any): any => {
  const sensitiveHeaders = ['authorization', 'x-api-key', 'x-api-secret', 'api_key', 'api_secret'];
  const masked = { ...headers };

  for (const header of sensitiveHeaders) {
    if (masked[header]) {
      masked[header] = maskApiKey(masked[header]);
    }
  }

  return masked;
};