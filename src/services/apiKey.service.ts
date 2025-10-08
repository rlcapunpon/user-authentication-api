import { ApiKey } from '@prisma/client';
import { prisma } from '../db';
import { verifyApiKeyHash } from '../utils/crypto';

export class ApiKeyService {
  /**
   * Validates an API key by checking if it exists and is not revoked
   * @param apiKey The API key to validate
   * @returns The ApiKey record if valid, null otherwise
   */
  static async validateApiKey(apiKey: string): Promise<ApiKey | null> {
    try {
      // Get all API keys and find the one that matches the hash
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          revoked: false,
        },
      });

      for (const keyRecord of apiKeys) {
        if (verifyApiKeyHash(apiKey, keyRecord.keyHash)) {
          return keyRecord;
        }
      }

      return null;
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  /**
   * Gets an API key by owner
   * @param owner The owner of the API key
   * @returns The ApiKey record if found, null otherwise
   */
  static async getApiKeyByOwner(owner: string): Promise<ApiKey | null> {
    try {
      return await prisma.apiKey.findFirst({
        where: {
          owner,
          revoked: false,
        },
      });
    } catch (error) {
      console.error('Error getting API key by owner:', error);
      return null;
    }
  }

  /**
   * Revokes an API key by owner
   * @param owner The owner of the API key to revoke
   * @returns True if the key was revoked, false otherwise
   */
  static async revokeApiKey(owner: string): Promise<boolean> {
    try {
      const result = await prisma.apiKey.updateMany({
        where: {
          owner,
          revoked: false,
        },
        data: {
          revoked: true,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Error revoking API key:', error);
      return false;
    }
  }

  /**
   * Creates a new API key
   * @param owner The owner of the new API key
   * @param apiKey The API key value
   * @returns The created ApiKey record, null if creation failed
   */
  static async createApiKey(owner: string, apiKey: string): Promise<ApiKey | null> {
    try {
      const { generateApiKeyHash } = await import('../utils/crypto');

      return await prisma.apiKey.create({
        data: {
          owner,
          keyHash: generateApiKeyHash(apiKey),
        },
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return null;
    }
  }
}