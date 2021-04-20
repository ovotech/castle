import {
  createCastle,
  produce,
  consumeEachMessage,
  createLogging,
  toLogCreator,
  LoggingContext,
} from '@ovotech/castle';
import { Event, EventSchema } from './avro';
import * as winston from 'winston';

// Define producers as pure functions
// With statically setting the typescript types and avro schemas
const mySender = produce<Event>({ topic: 'my-topic-1', schema: EventSchema });

// Define consumers as pure functions
// With statically setting which types it will accept
const eachEvent = consumeEachMessage<Event, LoggingContext<winston.Logger>>(
  async ({ message, logger }) => {
    logger.warn('Consumed', { event: message.value });
  },
);

const winstonLogger = winston.createLogger({ transports: [new winston.transports.Console()] });
// Logging middleware for the consumer
const logging = createLogging(winstonLogger);
// Custom Log creator for kafkajs https://kafka.js.org/docs/custom-logger
const logCreator = toLogCreator(winstonLogger);

const main = async () => {
  const castle = createCastle({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'], logCreator },
    consumers: [{ topic: 'my-topic-1', groupId: 'my-group-1', eachMessage: logging(eachEvent) }],
  });

  // Start all consumers and producers
  await castle.start();

  winstonLogger.info('Started');

  await mySender(castle.producer, [{ value: { field1: 'my-string' }, key: null }]);
};

main();
