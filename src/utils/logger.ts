import pino from 'pino';
import { LOG_LEVEL } from '../config/env';

const getLogLevel = (): string => {
  const level = LOG_LEVEL.toUpperCase();
  switch (level) {
    case 'DEBUG':
      return 'debug';
    case 'INFO':
      return 'info';
    case 'WARN':
      return 'warn';
    case 'ERROR':
      return 'error';
    default:
      return 'debug'; // Default to debug
  }
};

export const logger = pino({
  level: getLogLevel(),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});
