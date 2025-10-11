import { Router } from 'express';
import { weavrService } from '../services/weavrService';

const router = Router();

// ===== SENDS =====

// Create a send transaction
router.post('/sends', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/sends',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all send transactions
router.get('/sends', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/sends',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a bulk of send transactions
router.post('/sends/bulk', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/sends/bulk',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel send transactions
router.post('/sends/cancel', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/sends/cancel',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a send transaction
router.get('/sends/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/sends/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Issue a one-time password that can be used to verify a send
router.post('/sends/:id/sca/otp', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/sends/${req.params.id}/sca/otp`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify a send using a one-time password
router.post('/sends/:id/sca/otp/verify', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/sends/${req.params.id}/sca/otp/verify`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Issue a push notification that can be used to verify Send transaction
router.post('/sends/:id/sca/push', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/sends/${req.params.id}/sca/push`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TRANSFERS =====

// Create a transfer transaction
router.post('/transfers', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/transfers',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transfer transactions
router.get('/transfers', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/transfers',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel transfer transactions
router.post('/transfers/cancel', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/transfers/cancel',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get a transfer transaction
router.get('/transfers/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/transfers/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== OUTGOING WIRE TRANSFERS =====

// Create an outgoing wire transfer
router.post('/outgoing-wire-transfers', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/outgoing_wire_transfers',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all outgoing wire transfer transactions
router.get('/outgoing-wire-transfers', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      '/multi/outgoing_wire_transfers',
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a bulk of outgoing wire transfer transactions
router.post('/outgoing-wire-transfers/bulk', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/outgoing_wire_transfers/bulk',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel outgoing wire transfer transactions
router.post('/outgoing-wire-transfers/cancel', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      '/multi/outgoing_wire_transfers/cancel',
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get an outgoing wire transfer transaction
router.get('/outgoing-wire-transfers/:id', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'GET',
      `/multi/outgoing_wire_transfers/${req.params.id}`,
      undefined,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel an outgoing wire transfer transaction
router.post('/outgoing-wire-transfers/:id/cancel', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/outgoing_wire_transfers/${req.params.id}/cancel`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Confirm an outgoing wire transfer transaction
router.post('/outgoing-wire-transfers/:id/confirm', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/outgoing_wire_transfers/${req.params.id}/confirm`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Issue a one-time password that can be used to verify an outgoing wire transfer
router.post('/outgoing-wire-transfers/:id/sca/otp', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/outgoing_wire_transfers/${req.params.id}/sca/otp`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Verify an outgoing wire transfer using a one-time password
router.post('/outgoing-wire-transfers/:id/sca/otp/verify', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/outgoing_wire_transfers/${req.params.id}/sca/otp/verify`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Issue a push notification that can be used to verify an outgoing wire transfer
router.post('/outgoing-wire-transfers/:id/sca/push', async (req, res) => {
  try {
    const result = await weavrService.makeRequest(
      'POST',
      `/multi/outgoing_wire_transfers/${req.params.id}/sca/push`,
      req.body,
      req.headers['x-api-key'] as string || req.headers['api_key'] as string,
      req.headers['authorization'] as string || req.headers['auth_token'] as string
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== INCOMING WIRE TRANSFERS =====
// Note: This is typically a webhook endpoint that Weavr calls
// The route would be something like POST /webhooks/incoming-wire-transfers
// But since it's an event/webhook, it might be handled differently

export default router;