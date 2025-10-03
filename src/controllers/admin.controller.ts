import { Request, Response } from 'express';
import { getAdminStatus } from '../services/admin.service';

/**
 * Get admin status including counts of users, resources, and roles
 * Only accessible by SUPERADMIN users
 */
export const getAdminStatusCounts = async (req: Request, res: Response) => {
  try {
    const statusCounts = await getAdminStatus();
    res.status(200).json(statusCounts);
  } catch (error) {
    console.error('Error getting admin status:', error);
    res.status(500).json({ message: 'Failed to get admin status' });
  }
};