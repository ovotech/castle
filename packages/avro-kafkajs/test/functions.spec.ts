import {
  SchemaRegistry,
  AvroEachMessagePayload,
  toAvroEachMessage,
  toProducerRecord,
} from '../src';
import { Kafka, logLevel, Admin, Producer, Consumer } from 'kafkajs';
import { retry } from 'ts-retry-promise';
import * as uuid from 'uuid';
import { schema } from 'avsc';

interface MessageType {
  stringField: string;
  intField?: number | null;
}

type KeyType = number;

const schema: schema.RecordType = {
  type: 'record',
  name: 'TestMessage',
  fields: [
    { type: 'string', name: 'stringField' },
    { type: ['null', 'int'], name: 'intField' },
  ],
};

const keySchema: schema.PrimitiveType = 'int';

const topic = `dev_avroKafkajs_${uuid.v4()}`;

describe('Functions', () => {
  let producer: Producer;
  let consumer: Consumer;
  let admin: Admin;
  let schemaRegistry: SchemaRegistry;

  beforeEach(async () => {
    const kafka = new Kafka({ brokers: ['localhost:29092'], logLevel: logLevel.NOTHING });

    admin = kafka.admin();
    consumer = kafka.consumer({ groupId: 'test-1' });
    producer = kafka.producer();
    schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
    await Promise.all([consumer.connect(), producer.connect(), admin.connect()]);
  });

  afterEach(() => Promise.all([consumer.disconnect(), producer.disconnect(), admin.disconnect()]));

  it('Should process using helper functions', async () => {
    jest.setTimeout(10000);
    const consumed: AvroEachMessagePayload<MessageType>[] = [];

    await admin.createTopics({ topics: [{ topic, numPartitions: 2 }] });
    await consumer.subscribe({ topic });
    await consumer.run({
      partitionsConsumedConcurrently: 2,
      eachMessage: toAvroEachMessage<MessageType>(schemaRegistry, async (payload) => {
        consumed.push(payload);
      }),
    });

    await producer.send(
      await toProducerRecord<MessageType>(schemaRegistry, {
        topic,
        schema,
        messages: [
          { value: { intField: 10, stringField: 'test1' }, partition: 0, key: 'test-1' },
          { value: { intField: null, stringField: 'test2' }, partition: 1, key: 'test-2' },
        ],
      }),
    );

    await retry(
      async () => {
        expect(consumed).toHaveLength(2);
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 0,
            message: expect.objectContaining({
              key: Buffer.from('test-1'),
              value: { intField: 10, stringField: 'test1' },
              schema,
            }),
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 1,
            message: expect.objectContaining({
              key: Buffer.from('test-2'),
              value: { intField: null, stringField: 'test2' },
              schema,
            }),
          }),
        );
      },
      { delay: 1000, timeout: 4000 },
    );
  });

  it('Should process using raw SchemaRegistry with encoded keys', async () => {
    jest.setTimeout(10000);
    const consumed: Array<{ value: MessageType; key: KeyType; partition: number }> = [];

    await admin.createTopics({ topics: [{ topic, numPartitions: 2 }] });
    await consumer.subscribe({ topic });
    await consumer.run({
      partitionsConsumedConcurrently: 2,
      eachMessage: async (payload) => {
        const value = await schemaRegistry.decode<MessageType>(payload.message.value);
        const key = await schemaRegistry.decode<KeyType>(payload.message.key);
        consumed.push({ value, key, partition: payload.partition });
      },
    });

    const value1 = await schemaRegistry.encode<MessageType>(topic, 'value', schema, {
      intField: 10,
      stringField: 'test1',
    });

    const key1 = await schemaRegistry.encode<KeyType>(topic, 'key', keySchema, 101);

    const value2 = await schemaRegistry.encode<MessageType>(topic, 'value', schema, {
      intField: null,
      stringField: 'test2',
    });

    const key2 = await schemaRegistry.encode<KeyType>(topic, 'key', keySchema, 102);

    await producer.send({
      topic,
      messages: [
        { value: value1, partition: 0, key: key1 },
        { value: value2, partition: 1, key: key2 },
      ],
    });

    await retry(
      async () => {
        expect(consumed).toHaveLength(2);
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 0,
            value: { intField: 10, stringField: 'test1' },
            key: 101,
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 1,
            value: { intField: null, stringField: 'test2' },
            key: 102,
          }),
        );
      },
      { delay: 1000, timeout: 4000 },
    );
  });
});
