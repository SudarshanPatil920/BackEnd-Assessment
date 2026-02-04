import { Router } from 'express';
import { testConnection } from '../db/connection';

const router = Router();

router.get('/health', async (_req, res) => {
  const dbConnected = await testConnection();
  const status = dbConnected ? 'healthy' : 'unhealthy';
  const statusCode = dbConnected ? 200 : 503;
  
  res.status(statusCode).json({
    status,
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

export default router;
