import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/apiKey.service';

// Extend Express Request to include apiKey
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: string;
        owner: string;
        createdAt: Date;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using API keys
 * Expects the API key in the 'X-API-Key' header
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        message: 'Please provide an API key in the X-API-Key header',
      });
      return;
    }

    const validatedApiKey = await ApiKeyService.validateApiKey(apiKey);

    if (!validatedApiKey) {
      res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or revoked',
      });
      return;
    }

    // Attach API key info to request
    req.apiKey = {
      id: validatedApiKey.id,
      owner: validatedApiKey.owner,
      createdAt: validatedApiKey.createdAt,
    };

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      error: 'Authentication error',
      message: 'An error occurred during API key authentication',
    });
  }
};