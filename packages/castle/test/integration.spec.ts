import {
  createCastle,
  consumeEachMessage,
  produce,
  createLogging,
  LoggingContext,
  Logger,
  toLogCreator,
  consumeEachBatch,
  optionalConsumers,
} from '../src';
import * as uuid from 'uuid';
import { Schema } from 'avsc';
import { retry } from 'ts-retry-promise';
import { Admin } from 'kafkajs';

export interface Event1 {
  field1: string;
}
export interface Event2 {
  field2: string;
}

export const Event1Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

export const Event2Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field2', type: 'string' }],
};

const topic1 = `test-single-${uuid.v4()}`;
const topic2 = `test-batch-${uuid.v4()}`;
const topic3 = `test-sized-batch-${uuid.v4()}`;

const groupId1 = `test-group-1-${uuid.v4()}`;
const groupId2 = `test-group-2-${uuid.v4()}`;
const groupId3 = `test-group-3-${uuid.v4()}`;
const data: { [key: number]: string[] } = { 0: [], 1: [], 2: [] };

const sendEvent1 = produce<Event1>({ topic: topic1, schema: Event1Schema });
const sendEvent2 = produce<Event2>({ topic: topic2, schema: Event2Schema });
const sendEvent3 = produce<Event2>({ topic: topic3, schema: Event2Schema });
const eachEvent1 = consumeEachMessage<Event1, LoggingContext>(
  async ({ message, partition, logger }) => {
    data[partition].push(message.value.field1);
    logger.log('info', message.value.field1);
  },
);

const eachEvent2 = consumeEachBatch<Event2, LoggingContext>(async ({ batch, logger }) => {
  for (const msg of batch.messages) {
    data[batch.partition].push(msg.value.field2);
    logger.log('info', msg.value.field2);
  }
});

const log: Array<[string, string, unknown]> = [];
const myLogger: Logger = {
  log: (level, message, metadata) => log.push([level, message, metadata]),
};
const logging = createLogging(myLogger);
const logCreator = toLogCreator(myLogger);

const batchSizer = jest.fn();
let admin: Admin;
const castle = createCastle({
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logCreator },
  consumers: [
    ...optionalConsumers([
      { topic: undefined, groupId: groupId1, eachMessage: logging(eachEvent1) },
      { topic: undefined, groupId: groupId2, eachBatch: logging(eachEvent2) },
      { topic: topic1, fromBeginning: true, groupId: groupId1, eachMessage: logging(eachEvent1) },
      { topic: topic2, fromBeginning: true, groupId: groupId2, eachBatch: logging(eachEvent2) },
    ]),
    {
      topic: topic3,
      fromBeginning: true,
      groupId: groupId3,
      autoCommitInterval: 20000,
      autoCommitThreshold: 2,
      eachSizedBatch: async ({ batch: { messages, partition, firstOffset, lastOffset } }) => {
        const commitedOffset = await admin.fetchOffsets({ groupId: groupId3, topic: topic3 });
        batchSizer({
          partition,
          firstOffset: firstOffset(),
          lastOffset: lastOffset(),
          commitedOffset: commitedOffset.map(({ offset, partition }) => ({
            offset: +offset,
            partition,
          })),
          messages: messages.map(({ value: { field2 } }) => field2),
        });
      },
      maxBatchSize: 2,
    },
  ],
});

describe('Integration', () => {
  beforeEach(async () => {
    admin = castle.kafka.admin();
    await admin.connect();
    await admin.createTopics({
      topics: [
        { topic: topic1, numPartitions: 3 },
        { topic: topic2, numPartitions: 2 },
        { topic: topic3, numPartitions: 1 },
      ],
    });
    await castle.start();
  });

  afterEach(async () => {
    await admin.disconnect();
    await castle.stop();
  });

  it('Should process response', async () => {
    jest.setTimeout(15000);
    await Promise.all([
      sendEvent1(castle.producer, [{ value: { field1: 'test1' }, partition: 0 }]),
      sendEvent1(castle.producer, [
        { value: { field1: 'test2' }, partition: 1 },
        { value: { field1: 'test3' }, partition: 2 },
        { value: { field1: 'test4' }, partition: 0 },
      ]),

      sendEvent2(castle.producer, [
        { value: { field2: 'test5' }, partition: 1 },
        { value: { field2: 'test6' }, partition: 1 },
        { value: { field2: 'test7' }, partition: 0 },
      ]),
      sendEvent3(castle.producer, [
        { value: { field2: 'p0m1' }, partition: 0 },
        { value: { field2: 'p0m2' }, partition: 0 },
        { value: { field2: 'p0m3' }, partition: 0 },
        { value: { field2: 'p0m4' }, partition: 0 },
        { value: { field2: 'p0m5' }, partition: 0 },
      ]),
    ]);

    await retry(
      async () => {
        expect(castle.isRunning()).toBe(true);
        expect(data).toEqual({
          0: expect.arrayContaining(['test1', 'test4', 'test7']),
          1: expect.arrayContaining(['test2', 'test5', 'test6']),
          2: ['test3'],
        });

        expect(log).toContainEqual(['info', 'test1', undefined]);
        expect(log).toContainEqual(['info', 'test2', undefined]);
        expect(log).toContainEqual(['info', 'test3', undefined]);
        expect(log).toContainEqual(['info', 'test4', undefined]);
        expect(log).toContainEqual(['info', 'test5', undefined]);
        expect(log).toContainEqual(['info', 'test6', undefined]);
        expect(log).toContainEqual(['info', 'test7', undefined]);

        expect(batchSizer).toHaveBeenCalledWith({
          partition: 0,
          messages: ['p0m1', 'p0m2'],
          firstOffset: '0',
          lastOffset: '1',
          commitedOffset: expect.arrayContaining([{ partition: 0, offset: -1 }]),
        });
        expect(batchSizer).toHaveBeenCalledWith({
          partition: 0,
          messages: ['p0m3', 'p0m4'],
          firstOffset: '2',
          lastOffset: '3',
          commitedOffset: expect.arrayContaining([{ partition: 0, offset: 2 }]),
        });
        expect(batchSizer).toHaveBeenCalledWith({
          partition: 0,
          messages: ['p0m5'],
          firstOffset: '4',
          lastOffset: '4',
          commitedOffset: expect.arrayContaining([{ partition: 0, offset: 4 }]),
        });
      },
      { delay: 1000, retries: 10 },
    );
  });
});
