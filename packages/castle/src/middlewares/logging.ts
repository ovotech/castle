import { Middleware, CastleEachBatchPayload, CastleEachMessagePayload } from '../types';
import { logLevel, logCreator } from 'kafkajs';

export interface Metadata {
  [key: string]: unknown;
}

export interface Logger {
  log: (level: string, message: string, metadata?: Metadata) => void;
}

export interface LoggingContext<TLogger extends Logger = Logger> {
  logger: TLogger;
}

export interface LoggerOptions {
  consume?: (ctx: object) => [string, Metadata];
  error?: (error: Error) => [string, Metadata];
}

export const isBatch = (paylaod: object): paylaod is CastleEachBatchPayload => 'batch' in paylaod;
export const isMessage = (paylaod: object): paylaod is CastleEachMessagePayload =>
  'message' in paylaod;

export const defaultOptions: LoggerOptions = {
  consume: ctx => {
    if (isBatch(ctx)) {
      return [
        `Consume ${ctx.batch.topic}`,
        {
          topic: ctx.batch.topic,
          messages: ctx.batch.messages.length,
          partition: ctx.batch.partition,
          lag: ctx.batch.offsetLag(),
          offsetFirst: ctx.batch.firstOffset(),
          offsetLast: ctx.batch.lastOffset(),
          offsetLag: ctx.batch.offsetLag(),
        },
      ];
    } else if (isMessage(ctx)) {
      return [
        `Consume ${ctx.topic}`,
        {
          topic: ctx.topic,
          offset: ctx.message.offset,
          key: ctx.message.key,
          partition: ctx.partition,
        },
      ];
    } else {
      return ['Unknown payload', {}];
    }
  },
  error: error => [error.message, { stack: error.stack }],
};

export const createLogging = <TLogger extends Logger = Logger>(
  logger: TLogger,
  userOptions: Partial<LoggerOptions> = {},
): Middleware<LoggingContext<TLogger>> => next => async ctx => {
  const options = { ...defaultOptions, ...userOptions };

  try {
    if (options.consume) {
      logger.log('info', ...options.consume(ctx));
    }
    await next({ ...ctx, logger });
  } catch (errorOrFailure) {
    const error = errorOrFailure instanceof Error ? errorOrFailure : new Error(errorOrFailure);
    if (options.error) {
      logger.log('error', ...options.error(error));
    }
    throw error;
  }
};

const stringLevel: { [key in logLevel]: string } = {
  [logLevel.NOTHING]: 'error',
  [logLevel.ERROR]: 'error',
  [logLevel.WARN]: 'warn',
  [logLevel.INFO]: 'info',
  [logLevel.DEBUG]: 'debug',
};

export const toLogCreator = <TLogger extends Logger = Logger>(
  logger: TLogger,
): logCreator => () => ({ level, log: { message, ...extra } }) => {
  logger.log(stringLevel[level], message, extra);
};
