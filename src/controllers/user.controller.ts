import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { handleUnknownError } from './auth.controller'; // Re-use error handler
import { Prisma } from '@prisma/client';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (error) {
    handleUnknownError(error, res, 500);
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    handleUnknownError(error, res, 500);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, isSuperAdmin, firstName, lastName, nickName, contactNumber, reportTo } = req.body;
    const user = await userService.createUser(
      email,
      password,
      isSuperAdmin || false,
      firstName,
      lastName,
      nickName,
      contactNumber,
      reportTo
    );
    res.status(201).json(user);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const updateUserSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isSuperAdmin } = req.body;
    const user = await userService.updateUserSuperAdmin(id, isSuperAdmin);
    res.json(user);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const assignUserResourceRole = async (req: Request, res: Response) => {
  try {
    const { userId, roleId, resourceId } = req.body;
    const userResourceRole = await userService.assignUserResourceRole(userId, roleId, resourceId);
    res.status(201).json(userResourceRole);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const revokeUserResourceRole = async (req: Request, res: Response) => {
  try {
    const { userId, roleId, resourceId } = req.body;
    await userService.revokeUserResourceRole(userId, roleId, resourceId);
    res.status(204).send();
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deactivateUser(id);
    res.status(204).send();
  } catch (error) {
    handleUnknownError(error, res, 500);
  }
};

export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.activateUser(id);
    res.status(204).send();
  } catch (error) {
    handleUnknownError(error, res, 500);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'User not found' });
    }
    handleUnknownError(error, res, 500);
  }
};

export const listUsersV2 = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const email = req.query.email as string | undefined;
    const isActive = req.query.isActive ? (req.query.isActive as string).toLowerCase() === 'true' : undefined;
    const result = await userService.listUsersPaginated(page, limit, email, isActive);
    res.json(result);
  } catch (error) {
    handleUnknownError(error, res, 500);
  }
};
