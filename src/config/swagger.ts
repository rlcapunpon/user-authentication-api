import swaggerJsdoc from 'swagger-jsdoc';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PORT } from './env';

// Load the OpenAPI specification from the YAML file
const openApiPath = path.join(__dirname, '../../openapi.yaml');
const openApiContent = fs.readFileSync(openApiPath, 'utf8');
const swaggerSpec = yaml.load(openApiContent) as any;

// Update the server URL dynamically
swaggerSpec.servers = [
  {
    url: `http://localhost:${PORT}/api`,
    description: 'Development server',
  },
];

export { swaggerSpec };
