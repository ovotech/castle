import {
  SchemaRegistry,
  AvroKafka,
  AvroProducer,
  AvroConsumer,
  AvroEachMessagePayload,
  AvroBatch,
} from '../src';
import { Kafka, logLevel, Admin, CompressionTypes } from 'kafkajs';
import { retry } from 'ts-retry-promise';
import * as uuid from 'uuid';
import { Schema } from 'avsc';

const topic = `dev_avroKafkajs_${uuid.v4()}`;
interface MessageType {
  stringField: string;
  intField?: number | null;
}

const schema = {
  type: 'record',
  name: 'TestMessage',
  fields: [{ type: 'string', name: 'stringField' }, { type: ['null', 'int'], name: 'intField' }],
} as Schema;

describe('Class', () => {
  let producer: AvroProducer;
  let consumer: AvroConsumer;
  let admin: Admin;

  beforeEach(async () => {
    const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
    const kafka = new Kafka({ brokers: ['localhost:29092'], logLevel: logLevel.NOTHING });

    const avroKafka = new AvroKafka(schemaRegistry, kafka);
    const groupId = uuid.v4();

    admin = avroKafka.admin();
    consumer = avroKafka.consumer({ groupId });
    producer = avroKafka.producer();
    await Promise.all([consumer.connect(), producer.connect(), admin.connect()]);
  });

  afterEach(() => Promise.all([consumer.disconnect(), producer.disconnect(), admin.disconnect()]));

  it('Should process avro messages one by one', async () => {
    jest.setTimeout(10000);
    const consumed: AvroEachMessagePayload<MessageType>[] = [];

    await admin.createTopics({ topics: [{ topic, numPartitions: 2 }] });
    await consumer.subscribe({ topic });
    await consumer.run<MessageType>({
      partitionsConsumedConcurrently: 2,
      eachMessage: async payload => {
        consumed.push(payload);
      },
    });

    await producer.send<MessageType>({
      topic,
      schema,
      messages: [
        { value: { intField: 10, stringField: 'test1' }, partition: 0, key: 'test-1' },
        { value: { intField: null, stringField: 'test2' }, partition: 1, key: 'test-2' },
      ],
    });

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

  it('Should process avro messages in batches', async () => {
    jest.setTimeout(10000);
    const consumed: AvroBatch<MessageType>[] = [];

    await admin.createTopics({ topics: [{ topic, numPartitions: 2 }] });
    await consumer.subscribe({ topic });
    await consumer.run<MessageType>({
      eachBatch: async payload => {
        consumed.push(payload.batch);
      },
    });

    await producer.sendBatch({
      acks: -1,
      timeout: 3000,
      compression: CompressionTypes.None,
      topicMessages: [
        {
          topic,
          schema,
          messages: [
            { value: { intField: 1, stringField: 'test1' }, partition: 0, key: 'test-1' },
            { value: { intField: 2, stringField: 'test2' }, partition: 0, key: 'test-2' },
            { value: { intField: 3, stringField: 'test3' }, partition: 0, key: 'test-3' },
            { value: { intField: null, stringField: 'test4' }, partition: 1, key: 'test-4' },
          ],
        },
      ],
    });

    await retry(
      async () => {
        expect(consumed).toHaveLength(2);

        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 0,
            topic,
            messages: [
              expect.objectContaining({
                key: Buffer.from('test-1'),
                value: { intField: 1, stringField: 'test1' },
                schema,
              }),
              expect.objectContaining({
                key: Buffer.from('test-2'),
                value: { intField: 2, stringField: 'test2' },
                schema,
              }),
              expect.objectContaining({
                key: Buffer.from('test-3'),
                value: { intField: 3, stringField: 'test3' },
                schema,
              }),
            ],
          }),
        );

        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 1,
            topic,
            messages: [
              expect.objectContaining({
                key: Buffer.from('test-4'),
                value: { intField: null, stringField: 'test4' },
              }),
            ],
          }),
        );
      },
      { delay: 1000, timeout: 4000 },
    );
  });
});
