// routes/health.js
import express from 'express';
import { checkRedisHealth, reconnectRedis } from '../middleware/auth.js';

const router = express.Router();

// Redis health check endpoint
router.get('/redis-health', async (req, res) => {
  try {
    const health = await checkRedisHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ healthy: false, message: error.message });
  }
});

// Manual Redis reconnect endpoint
router.post('/redis-reconnect', async (req, res) => {
  try {
    const result = await reconnectRedis();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;