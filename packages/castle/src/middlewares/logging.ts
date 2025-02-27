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
  consume?: (
    ctx: CastleEachBatchPayload | CastleEachMessagePayload | Record<string, unknown>,
  ) => [string, Metadata];
  error?: (error: Error) => [string, Metadata];
}

export const isBatch = (
  paylaod: CastleEachBatchPayload | CastleEachMessagePayload | Record<string, unknown>,
): paylaod is CastleEachBatchPayload => 'batch' in paylaod;
export const isMessage = (
  paylaod: CastleEachBatchPayload | CastleEachMessagePayload | Record<string, unknown>,
): paylaod is CastleEachMessagePayload => 'message' in paylaod;

export const defaultOptions: LoggerOptions = {
  consume: (ctx) => {
    if (isBatch(ctx)) {
      const offsetFirst = ctx.batch.firstOffset();
      const offsetLast = ctx.batch.lastOffset();
      const offsetLag = ctx.batch.offsetLag();
      const messages = ctx.batch.messages.length;
      const partition = ctx.batch.partition;
      const topic = ctx.batch.topic;

      return [
        `Batch ${topic}[${partition}] msgs: ${messages}, offsets: ${offsetFirst}...${offsetLast}, lag: ${offsetLag}`,
        { topic, messages, partition, offsetFirst, offsetLast, offsetLag },
      ];
    } else if (isMessage(ctx)) {
      const offset = ctx.message.offset;
      const key = ctx.message.key;
      const partition = ctx.partition;
      const topic = ctx.topic;

      return [
        `Message ${topic}[${partition}] offset: ${offset}, key: ${key}`,
        { topic, offset, key, partition },
      ];
    } else {
      return ['Unknown payload', {}];
    }
  },
  error: (error) => [error.message, { stack: error.stack }],
};

export const createLogging = <TLogger extends Logger = Logger>(
  logger: TLogger,
  userOptions: Partial<LoggerOptions> = {},
): Middleware<LoggingContext<TLogger>> => (next) => async (ctx) => {
  const options = { ...defaultOptions, ...userOptions };

  try {
    if (options.consume) {
      logger.log('info', ...options.consume(ctx));
    }
    await next({ ...ctx, logger });
  } catch (errorOrFailure) {
    const error = errorOrFailure instanceof Error ? errorOrFailure : new Error('unknown failure');
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
