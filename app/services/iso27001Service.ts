import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  user_id?: number;
  action: string;
  resource: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  compliance_status: 'compliant' | 'non_compliant' | 'review_required';
}

export interface AccessControlRule {
  id: string;
  role: string;
  resource: string;
  permissions: string[]; // 'read', 'write', 'delete', 'admin'
  conditions?: Record<string, any>;
  active: boolean;
}

export class ISO27001Service {
  private static auditLog: AuditEvent[] = []; // In production, use database

  /**
   * Log audit event (ISO 27001 requirement)
   */
  static logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...event
    };

    this.auditLog.push(auditEvent);

    // Log to system logger with appropriate level
    const logLevel = this.getLogLevel(event.severity);
    logger[logLevel]('Audit Event', {
      id: auditEvent.id,
      user_id: auditEvent.user_id,
      action: auditEvent.action,
      resource: auditEvent.resource,
      severity: auditEvent.severity,
      compliance_status: auditEvent.compliance_status
    });

    // In production, persist to database and check for alerts
    this.checkForSecurityAlerts(auditEvent);
  }

  /**
   * Check access control (ISO 27001 A.9)
   */
  static async checkAccessControl(
    userId: number,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // In production, query database for user roles and permissions
      const userRoles = await this.getUserRoles(userId);
      const accessRules = await this.getAccessRules(resource);

      for (const rule of accessRules) {
        if (!rule.active) continue;

        if (userRoles.includes(rule.role)) {
          if (rule.permissions.includes(action)) {
            // Check additional conditions
            if (rule.conditions && !this.evaluateConditions(rule.conditions, context)) {
              continue;
            }

            return { allowed: true };
          }
        }
      }

      // Log access denial
      this.logAuditEvent({
        user_id: userId,
        action: `access_denied_${action}`,
        resource,
        details: { reason: 'insufficient_permissions', context },
        severity: 'medium',
        compliance_status: 'compliant'
      });

      return { allowed: false, reason: 'insufficient_permissions' };
    } catch (error) {
      logger.error('Access control check failed', { error, userId, resource, action });
      return { allowed: false, reason: 'system_error' };
    }
  }

  /**
   * Get audit trail for compliance reporting
   */
  static getAuditTrail(
    filters: {
      user_id?: number;
      action?: string;
      resource?: string;
      start_date?: Date;
      end_date?: Date;
      severity?: string;
    },
    limit: number = 100
  ): AuditEvent[] {
    let filtered = this.auditLog;

    if (filters.user_id) {
      filtered = filtered.filter(event => event.user_id === filters.user_id);
    }

    if (filters.action) {
      filtered = filtered.filter(event => event.action === filters.action);
    }

    if (filters.resource) {
      filtered = filtered.filter(event => event.resource === filters.resource);
    }

    if (filters.start_date) {
      filtered = filtered.filter(event => event.timestamp >= filters.start_date!);
    }

    if (filters.end_date) {
      filtered = filtered.filter(event => event.timestamp <= filters.end_date!);
    }

    if (filters.severity) {
      filtered = filtered.filter(event => event.severity === filters.severity);
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generate compliance report
   */
  static generateComplianceReport(startDate: Date, endDate: Date): {
    total_events: number;
    security_incidents: number;
    compliance_violations: number;
    access_denials: number;
    top_actions: Record<string, number>;
    severity_breakdown: Record<string, number>;
  } {
    const events = this.getAuditTrail({ start_date: startDate, end_date: endDate }, 10000);

    const report = {
      total_events: events.length,
      security_incidents: events.filter(e => e.severity === 'critical').length,
      compliance_violations: events.filter(e => e.compliance_status === 'non_compliant').length,
      access_denials: events.filter(e => e.action.startsWith('access_denied')).length,
      top_actions: {} as Record<string, number>,
      severity_breakdown: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };

    events.forEach(event => {
      // Count actions
      report.top_actions[event.action] = (report.top_actions[event.action] || 0) + 1;

      // Count severity
      report.severity_breakdown[event.severity]++;
    });

    return report;
  }

  /**
   * Check for security alerts
   */
  private static checkForSecurityAlerts(event: AuditEvent): void {
    // Check for suspicious patterns
    if (event.action === 'login_failed' && event.details && event.details.attempts > 5) {
      logger.warn('Multiple login failures detected', {
        user_id: event.user_id,
        ip_address: event.ip_address,
        attempts: event.details.attempts
      });
    }

    if (event.action === 'access_denied' && event.severity === 'high') {
      logger.warn('High-severity access denial', {
        user_id: event.user_id,
        resource: event.resource,
        ip_address: event.ip_address
      });
    }

    // Check for compliance violations
    if (event.compliance_status === 'non_compliant') {
      logger.error('Compliance violation detected', {
        event_id: event.id,
        action: event.action,
        details: event.details
      });
    }
  }

  /**
   * Get user roles (mock implementation)
   */
  private static async getUserRoles(userId: number): Promise<string[]> {
    // In production, query database
    // For now, return mock roles
    return ['user']; // Default role
  }

  /**
   * Get access rules for resource (mock implementation)
   */
  private static async getAccessRules(resource: string): Promise<AccessControlRule[]> {
    // In production, query database
    // For now, return mock rules
    return [
      {
        id: '1',
        role: 'user',
        resource: 'accounts',
        permissions: ['read'],
        active: true
      },
      {
        id: '2',
        role: 'admin',
        resource: '*',
        permissions: ['read', 'write', 'delete', 'admin'],
        active: true
      }
    ];
  }

  /**
   * Evaluate access control conditions
   */
  private static evaluateConditions(conditions: Record<string, any>, context?: Record<string, any>): boolean {
    if (!context) return true;

    // Simple condition evaluation
    for (const [key, expectedValue] of Object.entries(conditions)) {
      if (context[key] !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get appropriate log level
   */
  private static getLogLevel(severity: string): 'info' | 'warn' | 'error' {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  /**
   * Data encryption at rest (ISO 27001 A.10)
   */
  static encryptSensitiveData(data: string, key?: string): string {
    // In production, use proper encryption with key management
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32chars';
    const keyBuffer = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Prepend IV for decryption
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Data decryption
   */
  static decryptSensitiveData(encryptedData: string, key?: string): string {
    try {
      const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32chars';
      const keyBuffer = crypto.scryptSync(encryptionKey, 'salt', 32);

      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      logger.error('Data decryption failed', { error });
      throw new Error('Decryption failed');
    }
  }
}

export const iso27001Service = new ISO27001Service();