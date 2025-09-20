import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { authRoutes, rolesRoutes, permissionsRoutes, oidcRoutes, usersRoutes, configRoutes, resourcesRoutes, userDetailsRoutes } from './routes';
import { authGuard } from './middleware/auth.middleware';
import { swaggerSpec } from './config/swagger';

const app: Express = express();

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true, // Allow all origins if not specified
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/config', configRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/user-details', userDetailsRoutes);
app.use('/api', oidcRoutes); // OIDC routes under /api

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

export default app;
