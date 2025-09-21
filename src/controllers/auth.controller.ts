import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service'; // Import userService
import { logger } from '../utils/logger';

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
    logger.debug({
      msg: 'Registration failed',
      email: req.body.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
    handleUnknownError(error, res, 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await authService.login(email, password);
    res.json(tokens);
  } catch (error) {
    logger.debug({
      msg: 'Login failed',
      email: req.body.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
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
  const userId = req.user!.userId;

  logger.debug({
    msg: 'GetMe endpoint called',
    userId,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    headers: {
      'content-length': req.get('content-length'),
      'content-type': req.get('content-type'),
      'authorization': req.get('authorization') ? '[PRESENT]' : '[MISSING]',
      'user-agent': req.get('user-agent'),
    },
  });

  try {
    const user = await authService.getMe(userId);

    logger.debug({
      msg: 'GetMe successful',
      userId,
      ip: req.ip,
      hasDetails: !!user.details,
      hasReportTo: !!(user.details?.reportTo),
      resourcesCount: user.resources?.length || 0,
    });

    const responseData = JSON.stringify(user);
    logger.debug({
      msg: 'GetMe response prepared',
      userId,
      ip: req.ip,
      responseSize: responseData.length,
    });

    res.json(user);
  } catch (error) {
    logger.error({
      msg: 'GetMe endpoint error',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      path: req.path,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : 'Unknown error',
      statusCode: res.statusCode,
    });

    // Log additional context for 431 errors specifically
    if (res.statusCode === 431 || (error instanceof Error && error.message.includes('431'))) {
      logger.error({
        msg: '431 Error details for GetMe',
        userId,
        ip: req.ip,
        requestHeaders: req.headers,
        requestSize: JSON.stringify(req.headers).length,
        responseHeaders: res.getHeaders(),
      });
    }

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