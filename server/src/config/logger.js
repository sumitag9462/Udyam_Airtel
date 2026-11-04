import pino from 'pino';
import { config } from './env.js';

const levelMap = {
  development: 'debug',
  production: 'info',
  test: 'silent',
};

const redactPaths = [
  'gstin',
  'udyam_number',
  'udyamNumber',
  'phone',
  'phoneNumber',
  'token',
  'password',
  'cookie',
  'authorization',
  '*.gstin',
  '*.phone',
  '*.phoneNumber',
  '*.udyam_number',
  '*.udyamNumber',
  '*.token',
  '*.password',
];

const transport =
  config.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

const logger = pino({
  level: levelMap[config.NODE_ENV],
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  ...(transport && { transport }),
});

export default logger;
