import pino from 'pino';
import { config } from './config.js';

const logLevels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

export const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  },
});

export default logger;
