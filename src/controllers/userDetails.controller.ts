import { Request, Response } from 'express';
import { getUserDetails, updateUserDetails, deleteUserDetails, getAllUserDetails, getUserSubordinates } from '../services/userDetails.service';
import { prisma } from '../db';

export const getUserDetailsHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const isSuperAdmin = (req as any).user?.isSuperAdmin;

    // Only superadmin or the user themselves can view details
    if (!isSuperAdmin && userId !== id) {
      return res.status(403).json({ message: 'Access denied. You can only view your own details.' });
    }

    const userDetails = await getUserDetails(id);
    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found' });
    }

    res.json(userDetails);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserDetailsHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const isSuperAdmin = (req as any).user?.isSuperAdmin;
    const updateData = req.body;

    // Only superadmin or the user themselves can update details
    if (!isSuperAdmin && userId !== id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own details.' });
    }

    // If reportTo is provided, validate that the target user exists
    if (updateData.reportTo) {
      const targetUser = await prisma.user.findUnique({
        where: { id: updateData.reportTo },
      });
      if (!targetUser) {
        return res.status(400).json({ message: 'Invalid reportTo user ID' });
      }
    }

    const userDetails = await updateUserDetails(id, updateData);
    res.json(userDetails);
  } catch (error: any) {
    console.error('Error updating user details:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User details not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUserDetailsHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const isSuperAdmin = (req as any).user?.isSuperAdmin;

    // Only superadmin can delete user details
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Only superadmin can delete user details.' });
    }

    await deleteUserDetails(id);
    res.json({ message: 'User details deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user details:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'User details not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUserDetailsHandler = async (req: Request, res: Response) => {
  try {
    const isSuperAdmin = (req as any).user?.isSuperAdmin;

    // Only superadmin can view all user details
    if (!isSuperAdmin) {
      return res.status(403).json({ message: 'Access denied. Only superadmin can view all user details.' });
    }

    const allUserDetails = await getAllUserDetails();
    res.json(allUserDetails);
  } catch (error) {
    console.error('Error fetching all user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserSubordinatesHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const isSuperAdmin = (req as any).user?.isSuperAdmin;

    // Only superadmin or the manager themselves can view subordinates
    if (!isSuperAdmin && userId !== id) {
      return res.status(403).json({ message: 'Access denied. You can only view your own subordinates.' });
    }

    const subordinates = await getUserSubordinates(id);
    res.json(subordinates);
  } catch (error) {
    console.error('Error fetching user subordinates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};