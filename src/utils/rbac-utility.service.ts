/**
 * RBAC Utility Service
 * Handles RBAC API responses and provides utility functions for resource access
 */

export interface RbacApiResponse {
  data: Array<{
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class RbacUtilityService {
  /**
   * Process RBAC API response and extract resource information
   * @param userId - The user ID
   * @param response - The API response from /resources/v2 endpoint
   * @returns Object containing resource count and resource details
   */
  static processRbacResponse(userId: string, response: RbacApiResponse) {
    console.log(`LOG [RbacUtilityService] RBAC API response for user ${userId}:`);
    console.log(`LOG [RbacUtilityService]`, JSON.stringify(response, null, 2));

    // Correctly count resources from the data array
    const resourceCount = response.data ? response.data.length : 0;
    const resources = response.data || [];
    const totalResources = response.pagination?.total || 0;

    console.log(`LOG [RbacUtilityService] User ${userId} has access to ${resourceCount} resources:`);

    if (resourceCount > 0) {
      console.log(`LOG [RbacUtilityService] Resources:`, resources.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description
      })));
    }

    return {
      userId,
      resourceCount,
      totalResources,
      resources,
      pagination: response.pagination,
      hasAccess: resourceCount > 0
    };
  }

  /**
   * Check if user has access to specific resource
   * @param userId - The user ID
   * @param resourceId - The resource ID to check
   * @param response - The API response
   * @returns Boolean indicating if user has access to the resource
   */
  static hasAccessToResource(userId: string, resourceId: string, response: RbacApiResponse): boolean {
    const resources = response.data || [];
    return resources.some(resource => resource.id === resourceId);
  }

  /**
   * Get resource names that user has access to
   * @param response - The API response
   * @returns Array of resource names
   */
  static getAccessibleResourceNames(response: RbacApiResponse): string[] {
    const resources = response.data || [];
    return resources.map(resource => resource.name);
  }

  /**
   * Get resource IDs that user has access to
   * @param response - The API response
   * @returns Array of resource IDs
   */
  static getAccessibleResourceIds(response: RbacApiResponse): string[] {
    const resources = response.data || [];
    return resources.map(resource => resource.id);
  }
}