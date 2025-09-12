import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service'; // Import userService

export const handleUnknownError = (error: unknown, res: Response, statusCode: number) => {
  if (error instanceof Error) {
    res.status(statusCode).json({ message: error.message });
  } else {
    res.status(statusCode).json({ message: 'An unknown error occurred' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);
    res.status(201).json(user);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.login(email, password);
    res.json(tokens);
  } catch (error) {
    handleUnknownError(error, res, 401);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(204).send();
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    res.json(tokens);
  } catch (error) {
    handleUnknownError(error, res, 401);
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await authService.getMe(userId);
    res.json(user);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const validate = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const result = authService.validate(token);
    res.json(result);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { email, oldPassword, newPassword } = req.body;
    const updatedUser = await userService.updateUserProfile(userId, email, oldPassword, newPassword);
    res.json(updatedUser);
  } catch (error) {
    handleUnknownError(error, res, 400);
  }
};

export const deactivateMyAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    await userService.deactivateUser(userId);
    res.status(204).send();
  } catch (error) {
    handleUnknownError(error, res, 500);
  }
};