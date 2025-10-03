import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

import { authRoutes, rolesRoutes, permissionsRoutes, oidcRoutes, usersRoutes, userSpecificRouter, configRoutes, resourcesRoutes, userDetailsRoutes, adminRoutes, passwordResetRoutes } from './routes';
import { authGuard } from './middleware/auth.middleware';
import { swaggerSpec } from './config/swagger';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Express = express();

// Request logging middleware for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  // Log details for all auth endpoints to debug routing issues
  if (req.path.startsWith('/api/auth')) {
    logger.debug({
      msg: 'Incoming auth request',
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      contentLength: req.get('content-length'),
      authorization: req.get('authorization') ? '[PRESENT]' : '[MISSING]',
      params: req.params,
      query: req.query,
      pathSegments: req.path.split('/'),
      headersCount: Object.keys(req.headers).length,
    });
  }
  next();
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true, // Allow all origins if not specified
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increase URL-encoded payload limit

// Response logging middleware for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  const originalSend = res.send;

  // Only log for /me endpoint
  if (req.path === '/api/auth/me') {
    res.json = function(data: any) {
      logger.debug({
        msg: 'Response being sent for /me endpoint',
        method: req.method,
        path: req.path,
        ip: req.ip,
        statusCode: res.statusCode,
        responseSize: JSON.stringify(data).length,
        hasDetails: !!(data && data.details),
        hasResources: !!(data && data.resources),
        resourcesCount: data && data.resources ? data.resources.length : 0,
      });
      return originalJson.call(this, data);
    };

    res.send = function(data: any) {
      if (res.statusCode === 431) {
        logger.error({
          msg: '431 Error detected in response for /me endpoint',
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          requestHeaders: req.headers,
          responseHeaders: res.getHeaders(),
          responseData: typeof data === 'string' ? data.substring(0, 500) : JSON.stringify(data).substring(0, 500),
        });
      }
      return originalSend.call(this, data);
    };
  }

  next();
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user', userSpecificRouter);
app.use('/api/config', configRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/user-details', userDetailsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user/auth', passwordResetRoutes); // Password reset routes under /api/user/auth
app.use('/api', oidcRoutes); // OIDC routes under /api

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// 404 handler with logging to catch unmatched routes
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.error({
    msg: '404 - Route not found',
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  });
  
  console.error('[404] Route not found:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    pathSegments: req.path.split('/'),
    timestamp: new Date().toISOString(),
  });
  
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Express Error Handler:', err.stack);
  logger.error({
    msg: 'Express error handler',
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
  res.status(500).json({ message: 'Something broke!' });
});

export default app;
