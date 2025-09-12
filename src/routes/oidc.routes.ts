import { Router } from 'express';
import { getOpenIdConfiguration, getJwks } from '../controllers/oidc.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: OIDC
 *   description: OpenID Connect configuration
 */

/**
 * @swagger
 * /.well-known/openid-configuration:
 *   get:
 *     summary: Get OpenID Connect configuration
 *     tags: [OIDC]
 *     responses:
 *       200:
 *         description: OpenID Connect configuration
 */
router.get('/.well-known/openid-configuration', getOpenIdConfiguration);

/**
 * @swagger
 * /oauth/jwks.json:
 *   get:
 *     summary: Get JSON Web Key Set (JWKS)
 *     tags: [OIDC]
 *     responses:
 *       200:
 *         description: JSON Web Key Set
 */
router.get('/oauth/jwks.json', getJwks);

export default router;
