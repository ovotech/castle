import {
  createCastle,
  consumeEachMessage,
  produce,
  createLogging,
  LoggingContext,
  Logger,
  toLogCreator,
} from '../src';
import * as uuid from 'uuid';
import { Schema } from 'avsc';
import { retry } from 'ts-retry-promise';
import { Admin } from 'kafkajs';

export interface Event {
  field1: string;
}

export const EventSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

const topic = `test-${uuid.v4()}`;
const groupId = `test-group-${uuid.v4()}`;
const data: { [key: number]: string[] } = { 0: [], 1: [], 2: [] };

const sendEvent = produce<Event>({ topic, schema: EventSchema });
const eachEvent = consumeEachMessage<Event, LoggingContext>(
  async ({ message, partition, logger }) => {
    data[partition].push(message.value.field1);
    logger.log('info', message.value.field1);
  },
);

const log: Array<[string, string, any]> = [];
const myLogger: Logger = {
  log: (level, message, metadata) => log.push([level, message, metadata]),
};
const logging = createLogging(myLogger);
const logCreator = toLogCreator(myLogger);

const castle = createCastle({
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logCreator },
  consumers: [{ topic, groupId, eachMessage: logging(eachEvent) }],
});
let admin: Admin;

describe('Integration', () => {
  beforeEach(async () => {
    admin = castle.kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic, numPartitions: 3 }] });
    await castle.start();
  });

  afterEach(async () => {
    await admin.disconnect();
    await castle.stop();
  });

  it('Should process response', async () => {
    jest.setTimeout(10000);
    sendEvent(castle.producer, [{ value: { field1: 'test1' }, partition: 0 }]);
    sendEvent(castle.producer, [
      { value: { field1: 'test2' }, partition: 1 },
      { value: { field1: 'test3' }, partition: 2 },
      { value: { field1: 'test4' }, partition: 0 },
    ]);

    await retry(
      async () => {
        expect(data).toEqual({
          0: expect.arrayContaining(['test1', 'test4']),
          1: ['test2'],
          2: ['test3'],
        });

        expect(log).toContainEqual(['info', 'test1', undefined]);
        expect(log).toContainEqual(['info', 'test2', undefined]);
        expect(log).toContainEqual(['info', 'test3', undefined]);
        expect(log).toContainEqual(['info', 'test4', undefined]);
      },
      { delay: 1000, retries: 5 },
    );
  });
});
