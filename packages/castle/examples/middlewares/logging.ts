import { Middleware } from '@ovotech/castle';

export interface Logger {
  log: (...args: unknown[]) => void;
}

export interface LoggingContext {
  logger: Logger;
}

export const createLogging = (logger: Logger): Middleware<LoggingContext> => {
  return next => ctx => next({ ...ctx, logger });
};
