import { Request, Response } from 'express';
import * as rbacService from '../services/rbac.service';

/**
 * Handles the request to get all roles.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await rbacService.getAllRoles();
    res.json(roles);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

/**
 * Handles the request to get all permissions.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getPermissions = async (req: Request, res: Response) => {
  try {
    const permissions = await rbacService.getAllPermissions();
    res.json(permissions);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
};