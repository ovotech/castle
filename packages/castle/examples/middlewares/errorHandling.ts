import { Middleware } from '@ovotech/castle';
import { LoggingContext } from './logging';

export const createErrorHandling = (): Middleware<{}, LoggingContext> => {
  return next => async ctx => {
    try {
      await next(ctx);
    } catch (error) {
      ctx.logger.log('Error caught', error.message);
    }
  };
};
