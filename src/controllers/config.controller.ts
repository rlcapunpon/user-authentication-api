import { Request, Response } from 'express';
import { getRolePermissions } from '../services/config.service';

export const getConfigPermissions = async (req: Request, res: Response) => {
  try {
    const rolePermissions = await getRolePermissions();
    res.status(200).json(rolePermissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching config permissions', error });
  }
};
