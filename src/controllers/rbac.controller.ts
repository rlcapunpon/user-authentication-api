import { Request, Response } from 'express';
import * as rbacService from '../services/rbac.service';

/**
 * Handles the request to get all roles.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getRoles = async (req: Request, res: Response) => {
  try {
    const { resourceId } = req.query;
    const roles = await rbacService.getRolesByResource(resourceId as string);
    res.json(roles);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};

/**
 * Handles the request to get all resources.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await rbacService.getAllResources();
    res.json(resources);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Failed to fetch resources' });
  }
};

/**
 * Handles the request to create a new resource.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createResource = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const resource = await rbacService.createResource(name, description);
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Failed to create resource' });
  }
};

/**
 * Handles the request to create a new role.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createRole = async (req: Request, res: Response) => {
  try {
    const { name, permissions, resourceId } = req.body;
    const role = await rbacService.createRole(name, permissions, resourceId);
    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ message: 'Failed to create role' });
  }
};

/**
 * Handles the request to get available roles for UI consumption.
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const getAvailableRoles = async (req: Request, res: Response) => {
  try {
    const roles = await rbacService.getAvailableRoles();
    res.json(roles);
  } catch (error) {
    // Log the error for debugging purposes (optional, depending on logging setup)
    console.error('Error fetching available roles:', error);
    res.status(500).json({ message: 'Failed to fetch available roles' });
  }
};