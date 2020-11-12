import {
  SchemaRegistry,
  AvroKafka,
  AvroProducer,
  AvroConsumer,
  AvroEachMessagePayload,
  AvroBatch,
  AvroKafkaMessage,
} from '../src';
import { Kafka, logLevel, Admin, CompressionTypes } from 'kafkajs';
import { retry } from 'ts-retry-promise';
import * as uuid from 'uuid';
import { schema } from 'avsc';
import axios, { AxiosInstance } from 'axios';

interface MessageType {
  stringField: string;
  intField?: number | null;
}

interface Message2Type {
  stringField: string;
  otherField?: number;
  intField: number | null;
}

interface Message3Type {
  incompatibleName: string;
}

interface KeyType {
  id: number;
  section: 'first' | 'second';
}

const schema: schema.RecordType = {
  type: 'record',
  name: 'TestMessage',
  fields: [
    { type: 'string', name: 'stringField' },
    { type: ['null', 'int'], name: 'intField' },
  ],
};

const schema2: schema.RecordType = {
  type: 'record',
  name: 'TestMessage2',
  fields: [
    { type: 'string', name: 'stringField' },
    { type: 'int', name: 'otherField', default: 20 },
    { type: ['null', 'int'], name: 'intField' },
  ],
};

const schema3: schema.RecordType = {
  type: 'record',
  name: 'TestMessag3',
  fields: [{ type: 'string', name: 'incompatibleName' }],
};

const keySchema: schema.RecordType = {
  type: 'record',
  name: 'TestKey',
  fields: [
    { type: 'int', name: 'id' },
    { type: { type: 'enum', symbols: ['first', 'second'], name: 'SectionType' }, name: 'section' },
  ],
};

const TOPIC_ALIAS = 'topic-alias';

describe('Class', () => {
  let producer: AvroProducer;
  let consumer: AvroConsumer;
  let admin: Admin;
  let schemaRegistryApi: AxiosInstance;
  let groupId: string;
  let realTopicName: string;

  beforeEach(async () => {
    const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
    const kafka = new Kafka({ brokers: ['localhost:29092'], logLevel: logLevel.NOTHING });
    realTopicName = `dev_avroKafkajs_${uuid.v4()}`;

    const avroKafka = new AvroKafka(schemaRegistry, kafka, { [TOPIC_ALIAS]: realTopicName });
    groupId = uuid.v4();

    schemaRegistryApi = axios.create({
      headers: { 'Content-Type': 'application/vnd.schemaregistry.v1+json' },
      baseURL: 'http://localhost:8081',
    });
    admin = avroKafka.admin();
    consumer = avroKafka.consumer({ groupId });
    producer = avroKafka.producer();
    await Promise.all([consumer.connect(), producer.connect(), admin.connect()]);
  });

  afterEach(() => Promise.all([consumer.disconnect(), producer.disconnect(), admin.disconnect()]));

  it('Should process avro messages one by one', async () => {
    jest.setTimeout(12000);
    const consumed: AvroEachMessagePayload<MessageType | Message2Type | Message3Type>[] = [];

    await admin.createTopics({ topics: [{ topic: realTopicName, numPartitions: 2 }] });
    await consumer.subscribe({ topic: TOPIC_ALIAS });
    await consumer.run<MessageType | Message2Type | Message3Type>({
      partitionsConsumedConcurrently: 2,
      eachMessage: async (payload) => {
        consumed.push(payload);
      },
    });

    await producer.send<MessageType>({
      topic: TOPIC_ALIAS,
      schema,
      messages: [
        { value: { intField: 10, stringField: 'test1' }, partition: 0, key: 'test-1' },
        { value: { intField: null, stringField: 'test2' }, partition: 1, key: 'test-2' },
      ],
    });

    await producer.send<Message2Type>({
      topic: TOPIC_ALIAS,
      schema: schema2,
      messages: [
        {
          value: { intField: 10, stringField: 'test1', otherField: 2 },
          partition: 0,
          key: 'test-other-1',
        },
        {
          value: { intField: null, stringField: 'test2' },
          partition: 1,
          key: 'test-other-2',
        },
      ],
    });

    await schemaRegistryApi.put(`/config/${realTopicName}-value`, { compatibility: 'NONE' });

    await producer.send<Message3Type>({
      topic: TOPIC_ALIAS,
      schema: schema3,
      messages: [
        { value: { incompatibleName: 'totally different' }, partition: 0, key: 'test-different-1' },
      ],
    });

    const description = await consumer.describeGroup();
    expect(description).toMatchObject({ errorCode: 0, groupId });
    expect(consumer.paused()).toHaveLength(0);

    consumer.pause([{ topic: TOPIC_ALIAS }]);

    expect(consumer.paused()).toHaveLength(1);

    consumer.resume([{ topic: TOPIC_ALIAS }]);

    expect(consumer.paused()).toHaveLength(0);

    await retry(
      async () => {
        expect(consumed).toHaveLength(5);

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
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 0,
            message: expect.objectContaining({
              key: Buffer.from('test-other-1'),
              value: { intField: 10, stringField: 'test1', otherField: 2 },
            }),
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 1,
            message: expect.objectContaining({
              key: Buffer.from('test-other-2'),
              value: { intField: null, stringField: 'test2', otherField: 20 },
            }),
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 0,
            message: expect.objectContaining({
              key: Buffer.from('test-different-1'),
              value: { incompatibleName: 'totally different' },
              schema: schema3,
            }),
          }),
        );
      },
      { delay: 1000, retries: 4 },
    );

    let stopped = false;
    consumer.on('consumer.stop', () => (stopped = true));
    await consumer.stop();

    await retry(async () => expect(stopped).toBe(true), { delay: 1000, timeout: 2000 });
  });

  it('Should process avro messages with encoded keys', async () => {
    jest.setTimeout(12000);
    const consumed: AvroEachMessagePayload<MessageType, KeyType>[] = [];

    await admin.createTopics({ topics: [{ topic: realTopicName, numPartitions: 2 }] });
    await consumer.subscribe({ topic: TOPIC_ALIAS });
    await consumer.run<MessageType, KeyType>({
      partitionsConsumedConcurrently: 2,
      encodedKey: true,
      eachMessage: async (payload) => {
        consumed.push(payload);
      },
    });

    await producer.send<MessageType, KeyType>({
      topic: TOPIC_ALIAS,
      schema,
      keySchema,
      messages: [
        {
          value: { intField: 10, stringField: 'test1' },
          partition: 0,
          key: { id: 10, section: 'first' },
        },
        {
          value: { intField: null, stringField: 'test2' },
          partition: 1,
          key: { id: 12, section: 'second' },
        },
      ],
    });

    const description = await consumer.describeGroup();
    expect(description).toMatchObject({ errorCode: 0, groupId });
    expect(consumer.paused()).toHaveLength(0);

    consumer.pause([{ topic: TOPIC_ALIAS }]);

    expect(consumer.paused()).toHaveLength(1);

    consumer.resume([{ topic: TOPIC_ALIAS }]);

    expect(consumer.paused()).toHaveLength(0);

    await retry(
      async () => {
        expect(consumed).toHaveLength(2);
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 0,
            message: expect.objectContaining({
              key: { id: 10, section: 'first' },
              value: { intField: 10, stringField: 'test1' },
              schema,
            }),
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 1,
            message: expect.objectContaining({
              key: { id: 12, section: 'second' },
              value: { intField: null, stringField: 'test2' },
              schema,
            }),
          }),
        );
      },
      { delay: 1000, retries: 4 },
    );

    let stopped = false;
    consumer.on('consumer.stop', () => (stopped = true));
    await consumer.stop();

    await retry(async () => expect(stopped).toBe(true), { delay: 1000, timeout: 2000 });
  });

  it('Should process avro messages in batches', async () => {
    jest.setTimeout(12000);
    const consumed: AvroBatch<MessageType>[] = [];

    await admin.createTopics({ topics: [{ topic: realTopicName, numPartitions: 2 }] });
    await consumer.subscribe({ topic: TOPIC_ALIAS });
    await consumer.run<MessageType>({
      eachBatch: async (payload) => {
        consumed.push(payload.batch);
      },
    });

    await producer.sendBatch({
      acks: -1,
      timeout: 3000,
      compression: CompressionTypes.None,
      topicMessages: [
        {
          topic: TOPIC_ALIAS,
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
            topic: realTopicName,
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
            topic: realTopicName,
            messages: [
              expect.objectContaining({
                key: Buffer.from('test-4'),
                value: { intField: null, stringField: 'test4' },
              }),
            ],
          }),
        );
      },
      { delay: 1000, retries: 4 },
    );
  });

  it('Should process avro messages in batches with encoded keys', async () => {
    jest.setTimeout(12000);
    const consumed: AvroBatch<MessageType, KeyType>[] = [];

    await admin.createTopics({ topics: [{ topic: realTopicName, numPartitions: 2 }] });
    await consumer.subscribe({ topic: TOPIC_ALIAS });
    await consumer.run<MessageType, KeyType>({
      encodedKey: true,
      eachBatch: async (payload) => {
        consumed.push(payload.batch);
      },
    });

    await producer.sendBatch({
      acks: -1,
      timeout: 3000,
      compression: CompressionTypes.None,
      topicMessages: [
        {
          topic: TOPIC_ALIAS,
          schema,
          keySchema,
          messages: [
            {
              value: { intField: 1, stringField: 'test1' },
              partition: 0,
              key: { id: 1, section: 'first' },
            },
            {
              value: { intField: 2, stringField: 'test2' },
              partition: 0,
              key: { id: 2, section: 'first' },
            },
            {
              value: { intField: 3, stringField: 'test3' },
              partition: 0,
              key: { id: 3, section: 'first' },
            },
            {
              value: { intField: null, stringField: 'test4' },
              partition: 1,
              key: { id: 4, section: 'second' },
            },
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
            topic: realTopicName,
            messages: [
              expect.objectContaining({
                key: { id: 1, section: 'first' },
                value: { intField: 1, stringField: 'test1' },
                schema,
              }),
              expect.objectContaining({
                key: { id: 2, section: 'first' },
                value: { intField: 2, stringField: 'test2' },
                schema,
              }),
              expect.objectContaining({
                key: { id: 3, section: 'first' },
                value: { intField: 3, stringField: 'test3' },
                schema,
              }),
            ],
          }),
        );

        expect(consumed).toContainEqual(
          expect.objectContaining({
            partition: 1,
            topic: realTopicName,
            messages: [
              expect.objectContaining({
                key: { id: 4, section: 'second' },
                value: { intField: null, stringField: 'test4' },
              }),
            ],
          }),
        );
      },
      { delay: 1000, retries: 4 },
    );
  });

  it('Should produce avro messages with custom subject', async () => {
    jest.setTimeout(12000);
    const consumed: AvroKafkaMessage<MessageType>[] = [];

    await consumer.subscribe({ topic: TOPIC_ALIAS });
    await consumer.run<MessageType>({
      eachMessage: async (payload) => {
        consumed.push(payload.message);
      },
    });

    // Produce normally to create the subject
    await producer.send<MessageType>({
      topic: TOPIC_ALIAS,
      schema,
      messages: [{ value: { stringField: '1', intField: null } }],
    });

    // Use the subject directly to produce the messages
    await producer.send<MessageType>({
      topic: TOPIC_ALIAS,
      subject: `${realTopicName}-value`,
      messages: [
        { value: { stringField: '2', intField: null } },
        { value: { stringField: '3', intField: null } },
      ],
    });

    await retry(
      async () => {
        expect(consumed).toHaveLength(3);

        expect(consumed).toContainEqual(
          expect.objectContaining({ value: { stringField: '1', intField: null }, schema }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({ value: { stringField: '2', intField: null }, schema }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({ value: { stringField: '3', intField: null }, schema }),
        );
      },
      { delay: 1000, retries: 4 },
    );
  });

  it('Should produce avro messages with custom subject for key and value', async () => {
    jest.setTimeout(12000);
    const consumed: AvroKafkaMessage<MessageType, KeyType>[] = [];

    await consumer.subscribe({ topic: TOPIC_ALIAS });
    await consumer.run<MessageType, KeyType>({
      encodedKey: true,
      eachMessage: async (payload) => {
        consumed.push(payload.message);
      },
    });

    // Produce normally to create the subject
    await producer.send<MessageType, KeyType>({
      topic: TOPIC_ALIAS,
      schema,
      keySchema,
      messages: [{ value: { stringField: '1', intField: null }, key: { id: 1, section: 'first' } }],
    });

    // Use the subject directly to produce the messages
    await producer.send<MessageType, KeyType>({
      topic: TOPIC_ALIAS,
      subject: `${realTopicName}-value`,
      keySubject: `${realTopicName}-key`,
      messages: [
        { value: { stringField: '2', intField: null }, key: { id: 2, section: 'first' } },
        { value: { stringField: '3', intField: null }, key: { id: 3, section: 'second' } },
      ],
    });

    await retry(
      async () => {
        expect(consumed).toHaveLength(3);

        expect(consumed).toContainEqual(
          expect.objectContaining({
            value: { stringField: '1', intField: null },
            key: { id: 1, section: 'first' },
            schema,
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            value: { stringField: '2', intField: null },
            key: { id: 2, section: 'first' },
            schema,
          }),
        );
        expect(consumed).toContainEqual(
          expect.objectContaining({
            value: { stringField: '3', intField: null },
            key: { id: 3, section: 'second' },
            schema,
          }),
        );
      },
      { delay: 1000, retries: 4 },
    );
  });
});
