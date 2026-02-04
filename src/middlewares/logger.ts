import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latency: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(logData));
  });
  
  next();
};
