import {
  createCastle,
  createLogging,
  toLogCreator,
  Logger,
  consumeEachMessage,
  LoggingContext,
} from '@ovotech/castle';
import * as uuid from 'uuid';
import { Schema } from 'avsc';
import { Admin } from 'kafkajs';
import { ObjectReadableMock } from 'stream-mock';
import { retry } from 'ts-retry-promise';
import { createCastleStream } from '../src';
import { CastleStreamConsumerConfig } from '../src/types';

const topic1 = `test-1-${uuid.v4()}`;
const topic2 = `test-2-${uuid.v4()}`;
const groupId1 = `test-group-1-${uuid.v4()}`;

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

const log: Array<[string, string, unknown]> = [];
const myLogger: Logger = {
  log: (level, message, metadata) => log.push([level, message, metadata]),
};
const logging = createLogging(myLogger);
const logCreator = toLogCreator(myLogger);

const data: string[] = [];

const eachEvent1 = consumeEachMessage<Event1, LoggingContext>(async ({ message, logger }) => {
  data.push(message.value.field1);
  logger.log('info', message.value.field1);
});

const castle = createCastle({
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logCreator },
  consumers: [
    { topic: topic1, fromBeginning: true, groupId: groupId1, eachMessage: logging(eachEvent1) },
  ],
});

const event2Consumer1: CastleStreamConsumerConfig<string, Event2, null> = {
  topic: topic2,
  source: new ObjectReadableMock(['test1', 'test2', 'test3']),
  toKafkaMessage: (message) => ({ value: { field2: message }, key: null, schema: Event2Schema }),
  eachBatch: async ({ batch: { messages }, producer }) => {
    producer.send({
      topic: topic1,
      schema: Event1Schema,
      messages: messages.map((message) => ({
        value: { field1: `new-${message.value.field2}` },
      })),
    });
  },
};

const event2Consumer2: CastleStreamConsumerConfig<string, Event2, null> = {
  topic: topic2,
  source: new ObjectReadableMock(['test-other-1', 'test-other-2']),
  toKafkaMessage: (message) => ({ value: { field2: message }, key: null, schema: Event2Schema }),
  eachMessage: async ({ message, producer }) => {
    producer.send({
      topic: topic1,
      schema: Event1Schema,
      messages: [{ value: { field1: `new-${message.value.field2}` } }],
    });
  },
};

const castleStream = createCastleStream({
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logCreator },
  consumers: [event2Consumer1, event2Consumer2],
});

let admin: Admin;

describe('Integration', () => {
  beforeEach(async () => {
    admin = castle.kafka.admin();
    await admin.connect();
    await admin.createTopics({ topics: [{ topic: topic1 }, { topic: topic2 }] });
    await castle.start();
    await castleStream.start();
  });

  afterEach(async () => {
    await admin.disconnect();
    await castle.stop();
    await castleStream.stop();
  });

  it('Should process response', async () => {
    jest.setTimeout(15000);

    await retry(
      async () => {
        expect(castle.isRunning()).toBe(true);
        expect(castleStream.isRunning()).toBe(true);
        expect(data).toEqual(
          expect.arrayContaining([
            'new-test1',
            'new-test2',
            'new-test3',
            'new-test-other-1',
            'new-test-other-2',
          ]),
        );
      },
      { delay: 1000, retries: 3 },
    );
  });
});
