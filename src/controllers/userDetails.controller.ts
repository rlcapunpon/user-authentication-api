import { Request, Response } from 'express';
import { getUserDetails, updateUserDetails, deleteUserDetails, getAllUserDetails, getUserSubordinates } from '../services/userDetails.service';
import { prisma } from '../db';
import { logger } from '../utils/logger';

export const getUserDetailsHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const isSuperAdmin = (req as any).user?.isSuperAdmin;

  logger.debug({
    msg: 'Get user details attempt',
    targetUserId: id,
    requestingUserId: userId,
    isSuperAdmin,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    headers: {
      'authorization': req.get('authorization') ? '[PRESENT]' : '[MISSING]',
    },
  });

  try {
    // Only superadmin or the user themselves can view details
    if (!isSuperAdmin && userId !== id) {
      logger.debug({
        msg: 'Get user details access denied',
        targetUserId: id,
        requestingUserId: userId,
        isSuperAdmin,
        ip: req.ip,
        reason: 'User can only view their own details',
      });
      return res.status(403).json({ message: 'Access denied. You can only view your own details.' });
    }

    logger.debug({
      msg: 'Fetching user details from database',
      targetUserId: id,
      ip: req.ip,
    });

    const userDetails = await getUserDetails(id);
    if (!userDetails) {
      logger.debug({
        msg: 'User details not found',
        targetUserId: id,
        ip: req.ip,
        reason: 'No user details record exists',
      });
      return res.status(404).json({ message: 'User details not found' });
    }

    logger.debug({
      msg: 'User details retrieved successfully',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      hasDetails: !!userDetails,
      hasReportTo: !!(userDetails.reportTo),
    });

    res.json(userDetails);
  } catch (error) {
    logger.error({
      msg: 'Error fetching user details',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserDetailsHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const isSuperAdmin = (req as any).user?.isSuperAdmin;
  const updateData = req.body;

  logger.debug({
    msg: 'Update user details attempt',
    targetUserId: id,
    requestingUserId: userId,
    isSuperAdmin,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    updateData: {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      nickName: updateData.nickName,
      contactNumber: updateData.contactNumber,
      reportTo: updateData.reportTo,
    },
    headers: {
      'content-length': req.get('content-length'),
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization') ? '[PRESENT]' : '[MISSING]',
    },
  });

  try {
    // Only superadmin or the user themselves can update details
    if (!isSuperAdmin && userId !== id) {
      logger.debug({
        msg: 'Update user details access denied',
        targetUserId: id,
        requestingUserId: userId,
        isSuperAdmin,
        ip: req.ip,
        reason: 'User can only update their own details',
      });
      return res.status(403).json({ message: 'Access denied. You can only update your own details.' });
    }

    // If reportTo is provided, validate that the target user exists
    if (updateData.reportTo) {
      logger.debug({
        msg: 'Validating reportTo user',
        targetUserId: id,
        reportToUserId: updateData.reportTo,
        ip: req.ip,
      });

      const targetUser = await prisma.user.findUnique({
        where: { id: updateData.reportTo },
      });
      if (!targetUser) {
        logger.debug({
          msg: 'Invalid reportTo user ID',
          targetUserId: id,
          reportToUserId: updateData.reportTo,
          ip: req.ip,
          reason: 'Target user does not exist',
        });
        return res.status(400).json({ message: 'Invalid reportTo user ID' });
      }

      logger.debug({
        msg: 'reportTo user validation successful',
        targetUserId: id,
        reportToUserId: updateData.reportTo,
        reportToUserEmail: targetUser.email,
        ip: req.ip,
      });
    }

    logger.debug({
      msg: 'Updating user details in database',
      targetUserId: id,
      updateData,
      ip: req.ip,
    });

    const userDetails = await updateUserDetails(id, updateData);

    logger.debug({
      msg: 'User details updated successfully',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      updatedFields: {
        firstName: !!updateData.firstName,
        lastName: !!updateData.lastName,
        nickName: !!updateData.nickName,
        contactNumber: !!updateData.contactNumber,
        reportTo: !!updateData.reportTo,
      },
      hasReportTo: !!(userDetails.reportTo),
    });

    res.json(userDetails);
  } catch (error: any) {
    logger.error({
      msg: 'Error updating user details',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      updateData,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
      prismaErrorCode: error.code,
    });

    if (error.code === 'P2025') {
      logger.debug({
        msg: 'User details not found for update',
        targetUserId: id,
        ip: req.ip,
        reason: 'Prisma P2025 error - record not found',
      });
      return res.status(404).json({ message: 'User details not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUserDetailsHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const isSuperAdmin = (req as any).user?.isSuperAdmin;

  logger.debug({
    msg: 'Delete user details attempt',
    targetUserId: id,
    requestingUserId: userId,
    isSuperAdmin,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    headers: {
      'authorization': req.get('authorization') ? '[PRESENT]' : '[MISSING]',
    },
  });

  try {
    // Only superadmin can delete user details
    if (!isSuperAdmin) {
      logger.debug({
        msg: 'Delete user details access denied',
        targetUserId: id,
        requestingUserId: userId,
        isSuperAdmin,
        ip: req.ip,
        reason: 'Only superadmin can delete user details',
      });
      return res.status(403).json({ message: 'Access denied. Only superadmin can delete user details.' });
    }

    logger.debug({
      msg: 'Deleting user details from database',
      targetUserId: id,
      ip: req.ip,
    });

    await deleteUserDetails(id);

    logger.debug({
      msg: 'User details deleted successfully',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
    });

    res.json({ message: 'User details deleted successfully' });
  } catch (error: any) {
    logger.error({
      msg: 'Error deleting user details',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
      prismaErrorCode: error.code,
    });

    if (error.code === 'P2025') {
      logger.debug({
        msg: 'User details not found for deletion',
        targetUserId: id,
        ip: req.ip,
        reason: 'Prisma P2025 error - record not found',
      });
      return res.status(404).json({ message: 'User details not found' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUserDetailsHandler = async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const isSuperAdmin = (req as any).user?.isSuperAdmin;

  logger.debug({
    msg: 'Get all user details attempt',
    requestingUserId: userId,
    isSuperAdmin,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    headers: {
      'authorization': req.get('authorization') ? '[PRESENT]' : '[MISSING]',
    },
  });

  try {
    // Only superadmin can view all user details
    if (!isSuperAdmin) {
      logger.debug({
        msg: 'Get all user details access denied',
        requestingUserId: userId,
        isSuperAdmin,
        ip: req.ip,
        reason: 'Only superadmin can view all user details',
      });
      return res.status(403).json({ message: 'Access denied. Only superadmin can view all user details.' });
    }

    logger.debug({
      msg: 'Fetching all user details from database',
      requestingUserId: userId,
      ip: req.ip,
    });

    const allUserDetails = await getAllUserDetails();

    logger.debug({
      msg: 'All user details retrieved successfully',
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      totalUsers: allUserDetails.length,
    });

    res.json(allUserDetails);
  } catch (error) {
    logger.error({
      msg: 'Error fetching all user details',
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserSubordinatesHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.userId;
  const isSuperAdmin = (req as any).user?.isSuperAdmin;

  logger.debug({
    msg: 'Get user subordinates attempt',
    targetUserId: id,
    requestingUserId: userId,
    isSuperAdmin,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    headers: {
      'authorization': req.get('authorization') ? '[PRESENT]' : '[MISSING]',
    },
  });

  try {
    // Only superadmin or the manager themselves can view subordinates
    if (!isSuperAdmin && userId !== id) {
      logger.debug({
        msg: 'Get user subordinates access denied',
        targetUserId: id,
        requestingUserId: userId,
        isSuperAdmin,
        ip: req.ip,
        reason: 'User can only view their own subordinates',
      });
      return res.status(403).json({ message: 'Access denied. You can only view your own subordinates.' });
    }

    logger.debug({
      msg: 'Fetching user subordinates from database',
      targetUserId: id,
      ip: req.ip,
    });

    const subordinates = await getUserSubordinates(id);

    logger.debug({
      msg: 'User subordinates retrieved successfully',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      subordinatesCount: subordinates.length,
    });

    res.json(subordinates);
  } catch (error) {
    logger.error({
      msg: 'Error fetching user subordinates',
      targetUserId: id,
      requestingUserId: userId,
      isSuperAdmin,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
    });
    res.status(500).json({ message: 'Internal server error' });
  }
};