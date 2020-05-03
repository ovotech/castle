import { Schema } from 'avsc';
import { ObjectReadableMock } from 'stream-mock';
import { createCastleStream } from '@ovotech/castle-stream';
import { CastleStreamConsumerConfig } from '../src';

export interface Event1 {
  field1: string;
}

export interface Event2 {
  field2: number;
}

export const Event1Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

export const Event2Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field2', type: 'int' }],
};

const consumer1: CastleStreamConsumerConfig<string, Event1> = {
  topic: 'test1',
  source: new ObjectReadableMock(['test1', 'test2', 'test3']),
  eachMessage: async ({ message }) => {
    console.log(message);
  },
  toKafkaMessage: (message) => ({
    key: Buffer.from(''),
    value: { field1: message },
    schema: Event1Schema,
  }),
};

/**
 * We can configure additional details of each message, like partition, offset, keys or other metadata and consume it in batches
 */
const consumer2: CastleStreamConsumerConfig<{ p: number; m: number; o: number }, Event2> = {
  topic: 'test2',
  source: new ObjectReadableMock([
    { p: 0, m: 5, o: 0 },
    { p: 1, m: 6, o: 1 },
    { p: 0, m: 7, o: 0 },
  ]),
  eachBatch: async ({ batch: { partition, messages } }) => {
    console.log(`P: ${partition}`, messages);
  },
  toKafkaMessage: (message) => ({
    partition: message.p,
    key: Buffer.from(''),
    value: { field2: message.m },
    offset: String(message.o),
    schema: Event1Schema,
  }),
};

const main = async () => {
  const castleStream = createCastleStream({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [consumer1, consumer2],
  });

  await castleStream.start();
};

main();
