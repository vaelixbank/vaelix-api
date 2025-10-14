// ============================================
// Vaelix Bank API - Webhook Service
// ============================================
// Manages webhooks and event notifications for Open Banking
// ============================================

import crypto from 'crypto';
import axios from 'axios';
import { OpenBankingWebhookEvent, OpenBankingEventType } from '../models/OpenBanking';
import pool from '../utils/database';

export interface WebhookSubscription {
  subscriptionId: string;
  tppId: string;
  webhookUrl: string;
  events: OpenBankingEventType[];
  secret: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export class WebhookService {
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 10000;

  // Send webhook event
  async sendEvent(event: OpenBankingWebhookEvent): Promise<void> {
    try {
      // Get active webhook subscriptions for this TPP
      const subscriptions = await this.getActiveSubscriptions(event.tppId || '');

      // Send to all active subscriptions
      const promises = subscriptions
        .filter(sub => this.shouldSendEvent(sub, event.eventType))
        .map(sub => this.sendToSubscription(sub, event));

      await Promise.allSettled(promises);

      // Log the event
      await this.logWebhookEvent(event);

    } catch (error) {
      console.error('Error sending webhook event:', error);
      // Don't throw - webhooks should not break the main flow
    }
  }

  // Create webhook subscription
  async createSubscription(subscription: {
    tppId: string;
    webhookUrl: string;
    events: OpenBankingEventType[];
    secret?: string;
  }): Promise<WebhookSubscription> {
    const subscriptionId = crypto.randomUUID();
    const secret = subscription.secret || crypto.randomBytes(32).toString('hex');

    const sub: WebhookSubscription = {
      subscriptionId,
      tppId: subscription.tppId,
      webhookUrl: subscription.webhookUrl,
      events: subscription.events,
      secret,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await pool.query(
      `INSERT INTO webhook_subscriptions (
        subscription_id, tpp_id, webhook_url, events, secret, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        sub.subscriptionId,
        sub.tppId,
        sub.webhookUrl,
        JSON.stringify(sub.events),
        sub.secret,
        sub.status,
        sub.createdAt,
        sub.updatedAt
      ]
    );

    return sub;
  }

  // Get webhook subscription
  async getSubscription(subscriptionId: string): Promise<WebhookSubscription | null> {
    const result = await pool.query(
      'SELECT * FROM webhook_subscriptions WHERE subscription_id = $1',
      [subscriptionId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      subscriptionId: row.subscription_id,
      tppId: row.tpp_id,
      webhookUrl: row.webhook_url,
      events: JSON.parse(row.events),
      secret: row.secret,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Update webhook subscription
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Pick<WebhookSubscription, 'webhookUrl' | 'events' | 'status'>>
  ): Promise<void> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.webhookUrl !== undefined) {
      fields.push(`webhook_url = $${paramIndex}`);
      values.push(updates.webhookUrl);
      paramIndex++;
    }

    if (updates.events !== undefined) {
      fields.push(`events = $${paramIndex}`);
      values.push(JSON.stringify(updates.events));
      paramIndex++;
    }

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;
    }

    fields.push(`updated_at = NOW()`);
    values.push(subscriptionId);

    const query = `UPDATE webhook_subscriptions SET ${fields.join(', ')} WHERE subscription_id = $${paramIndex}`;

    await pool.query(query, values);
  }

  // Delete webhook subscription
  async deleteSubscription(subscriptionId: string): Promise<void> {
    await pool.query('DELETE FROM webhook_subscriptions WHERE subscription_id = $1', [subscriptionId]);
  }

  // Get active subscriptions for TPP
  private async getActiveSubscriptions(tppId: string): Promise<WebhookSubscription[]> {
    const result = await pool.query(
      'SELECT * FROM webhook_subscriptions WHERE tpp_id = $1 AND status = $2',
      [tppId, 'active']
    );

    return result.rows.map(row => ({
      subscriptionId: row.subscription_id,
      tppId: row.tpp_id,
      webhookUrl: row.webhook_url,
      events: JSON.parse(row.events),
      secret: row.secret,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  }

  // Check if event should be sent to subscription
  private shouldSendEvent(subscription: WebhookSubscription, eventType: string): boolean {
    return subscription.events.includes(eventType as OpenBankingEventType);
  }

  // Send event to specific subscription
  private async sendToSubscription(
    subscription: WebhookSubscription,
    event: OpenBankingWebhookEvent
  ): Promise<void> {
    const payload = {
      ...event,
      deliveredAt: new Date().toISOString()
    };

    // Create signature for webhook verification
    const signature = this.createSignature(payload, subscription.secret);

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(subscription.webhookUrl, payload, {
          timeout: this.TIMEOUT_MS,
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Attempt': attempt.toString(),
            'User-Agent': 'Vaelix-Bank-Webhook/1.0'
          }
        });

        if (response.status >= 200 && response.status < 300) {
          await this.logWebhookDelivery(event.eventId, subscription.subscriptionId, true, response.status);
          return;
        }

      } catch (error: any) {
        console.warn(`Webhook attempt ${attempt} failed for ${subscription.webhookUrl}:`, error.message);

        if (attempt === this.MAX_RETRIES) {
          await this.logWebhookDelivery(event.eventId, subscription.subscriptionId, false, error.response?.status);
        }
      }
    }
  }

  // Create webhook signature for verification
  private createSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  // Verify webhook signature
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.createSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  // Log webhook event
  private async logWebhookEvent(event: OpenBankingWebhookEvent): Promise<void> {
    await pool.query(
      `INSERT INTO webhook_events (
        event_id, event_type, payload, tpp_id, psu_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.eventId,
        event.eventType,
        JSON.stringify(event),
        event.tppId,
        event.psuId,
        new Date(event.timestamp)
      ]
    );
  }

  // Log webhook delivery attempt
  private async logWebhookDelivery(
    eventId: string,
    subscriptionId: string,
    success: boolean,
    statusCode?: number
  ): Promise<void> {
    await pool.query(
      `INSERT INTO webhook_deliveries (
        event_id, subscription_id, success, status_code, delivered_at
      ) VALUES ($1, $2, $3, $4, NOW())`,
      [eventId, subscriptionId, success, statusCode]
    );
  }

  // Get webhook delivery statistics
  async getDeliveryStats(subscriptionId: string, days: number = 7): Promise<{
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  }> {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN success THEN 1 END) as successful,
        COUNT(CASE WHEN NOT success THEN 1 END) as failed
       FROM webhook_deliveries
       WHERE subscription_id = $1
       AND delivered_at >= NOW() - INTERVAL '${days} days'`,
      [subscriptionId]
    );

    const stats = result.rows[0];
    return {
      total: parseInt(stats.total),
      successful: parseInt(stats.successful),
      failed: parseInt(stats.failed),
      averageResponseTime: 0 // TODO: Implement response time tracking
    };
  }
}