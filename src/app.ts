import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { authRoutes, rolesRoutes, permissionsRoutes, oidcRoutes, usersRoutes, configRoutes } from './routes';
import { authGuard } from './middleware/auth.middleware';
import { swaggerSpec } from './config/swagger';

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/auth', authRoutes);
app.use('/roles', rolesRoutes);
app.use('/permissions', permissionsRoutes);
app.use('/users', usersRoutes);
app.use('/config', configRoutes);
app.use('/', oidcRoutes); // OIDC routes are at the root

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

export default app;
