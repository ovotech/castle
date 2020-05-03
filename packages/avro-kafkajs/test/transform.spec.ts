import { AvroTransformBatch } from '../src';
import { ObjectReadableMock, ObjectWritableMock } from 'stream-mock';
import * as uuid from 'uuid';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { schema } from 'avsc';

const asyncPipeline = promisify(pipeline);

interface ValueType {
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

const topic = `dev_avroKafkajs_${uuid.v4()}`;

describe('Transform', () => {
  it('Should convert a stream to batch payloads and fill in special attributes', async () => {
    interface MessageType {
      partition: string;
      key: string;
      stringField: string;
      intField?: number | null;
    }

    const messages: MessageType[] = [
      { partition: '0', key: '10', stringField: 'AA10', intField: 10 },
      { partition: '1', key: '11', stringField: 'AA11', intField: 11 },
      { partition: '1', key: '12', stringField: 'AA12', intField: 12 },
      { partition: '2', key: '13', stringField: 'AA13', intField: 13 },
      { partition: '2', key: '14', stringField: 'AA14', intField: 14 },
      { partition: '2', key: '15', stringField: 'AA15', intField: 15 },
      { partition: '1', key: '16', stringField: 'AA16', intField: 16 },
      { partition: '0', key: '17', stringField: 'AA17', intField: 17 },
      { partition: '0', key: '18', stringField: 'AA18', intField: 18 },
      { partition: '1', key: '19', stringField: 'AA19', intField: 19 },
    ];

    const transform = new AvroTransformBatch<MessageType, ValueType, KeyType>({
      partitionHighWaterMark: 2,
      topic,
      toPartition: (message) => Number(message.partition),
      toKafkaMessage: ({ intField, stringField, key }) => ({
        key: Number(key),
        schema,
        value: { stringField, intField },
      }),
    });
    const source = new ObjectReadableMock(messages);
    const sink = new ObjectWritableMock();

    await asyncPipeline(source, transform, sink);

    const result = sink.data.map(({ batch: { partition, messages } }) => ({ partition, messages }));
    expect(result).toEqual([
      {
        partition: 1,
        messages: [
          expect.objectContaining({
            key: 11,
            offset: '0',
            value: { stringField: 'AA11', intField: 11 },
          }),
          expect.objectContaining({
            key: 12,
            offset: '1',
            value: { stringField: 'AA12', intField: 12 },
          }),
        ],
      },
      {
        partition: 2,
        messages: [
          expect.objectContaining({
            key: 13,
            offset: '0',
            value: { stringField: 'AA13', intField: 13 },
          }),
          expect.objectContaining({
            key: 14,
            offset: '1',
            value: { stringField: 'AA14', intField: 14 },
          }),
        ],
      },
      {
        partition: 0,
        messages: [
          expect.objectContaining({
            key: 10,
            offset: '0',
            value: { stringField: 'AA10', intField: 10 },
          }),
          expect.objectContaining({
            key: 17,
            offset: '1',
            value: { stringField: 'AA17', intField: 17 },
          }),
        ],
      },
      {
        partition: 1,
        messages: [
          expect.objectContaining({
            key: 16,
            offset: '2',
            value: { stringField: 'AA16', intField: 16 },
          }),
          expect.objectContaining({
            key: 19,
            offset: '3',
            value: { stringField: 'AA19', intField: 19 },
          }),
        ],
      },
      {
        partition: 0,
        messages: [
          expect.objectContaining({
            key: 18,
            offset: '2',
            value: { stringField: 'AA18', intField: 18 },
          }),
        ],
      },
      {
        partition: 2,
        messages: [
          expect.objectContaining({
            key: 15,
            offset: '2',
            value: { stringField: 'AA15', intField: 15 },
          }),
        ],
      },
    ]);
  });

  it('Should convert a stream to batch payloads and use specified attributes', async () => {
    interface MessageType {
      partition: string;
      key: string;
      size: number;
      attributes: number;
      timestamp: string;
      offset: number;
      stringField: string;
      intField?: number | null;
    }

    const messages: MessageType[] = [
      {
        partition: '0',
        offset: 40,
        key: '10',
        stringField: 'AA10',
        intField: 10,
        size: 20,
        attributes: 30,
        timestamp: '2020-01-01',
      },
      {
        partition: '1',
        offset: 41,
        key: '11',
        stringField: 'AA11',
        intField: 11,
        size: 21,
        attributes: 31,
        timestamp: '2020-01-02',
      },
      {
        partition: '1',
        offset: 42,
        key: '12',
        stringField: 'AA12',
        intField: 12,
        size: 22,
        attributes: 32,
        timestamp: '2020-01-03',
      },
      {
        partition: '2',
        offset: 43,
        key: '13',
        stringField: 'AA13',
        intField: 13,
        size: 23,
        attributes: 33,
        timestamp: '2020-01-04',
      },
      {
        partition: '2',
        offset: 44,
        key: '14',
        stringField: 'AA14',
        intField: 14,
        size: 24,
        attributes: 34,
        timestamp: '2020-01-05',
      },
      {
        partition: '2',
        offset: 45,
        key: '15',
        stringField: 'AA15',
        intField: 15,
        size: 25,
        attributes: 35,
        timestamp: '2020-01-06',
      },
      {
        partition: '1',
        offset: 46,
        key: '16',
        stringField: 'AA16',
        intField: 16,
        size: 26,
        attributes: 36,
        timestamp: '2020-01-07',
      },
      {
        partition: '0',
        offset: 47,
        key: '17',
        stringField: 'AA17',
        intField: 17,
        size: 27,
        attributes: 37,
        timestamp: '2020-01-08',
      },
      {
        partition: '0',
        offset: 48,
        key: '18',
        stringField: 'AA18',
        intField: 18,
        size: 28,
        attributes: 38,
        timestamp: '2020-01-09',
      },
      {
        partition: '1',
        offset: 49,
        key: '19',
        stringField: 'AA19',
        intField: 19,
        size: 29,
        attributes: 39,
        timestamp: '2020-01-10',
      },
    ];

    const transform = new AvroTransformBatch<MessageType, ValueType, KeyType>({
      partitionHighWaterMark: 2,
      topic,
      toPartition: (message) => Number(message.partition),
      toKafkaMessage: ({ intField, stringField, key, size, offset, timestamp, attributes }) => ({
        key: Number(key),
        schema,
        size,
        offset: String(offset),
        timestamp: new Date(timestamp).toISOString(),
        attributes,
        value: { stringField, intField },
      }),
    });
    const source = new ObjectReadableMock(messages);
    const sink = new ObjectWritableMock();

    await asyncPipeline(source, transform, sink);

    const result = sink.data.map(({ batch: { partition, messages } }) => ({ partition, messages }));
    expect(result).toEqual([
      {
        partition: 1,
        messages: [
          expect.objectContaining({
            key: 11,
            offset: '41',
            size: 21,
            attributes: 31,
            timestamp: '2020-01-02T00:00:00.000Z',
            value: { stringField: 'AA11', intField: 11 },
          }),
          expect.objectContaining({
            key: 12,
            offset: '42',
            size: 22,
            attributes: 32,
            timestamp: '2020-01-03T00:00:00.000Z',
            value: { stringField: 'AA12', intField: 12 },
          }),
        ],
      },
      {
        partition: 2,
        messages: [
          expect.objectContaining({
            key: 13,
            offset: '43',
            size: 23,
            attributes: 33,
            timestamp: '2020-01-04T00:00:00.000Z',
            value: { stringField: 'AA13', intField: 13 },
          }),
          expect.objectContaining({
            key: 14,
            offset: '44',
            size: 24,
            attributes: 34,
            timestamp: '2020-01-05T00:00:00.000Z',
            value: { stringField: 'AA14', intField: 14 },
          }),
        ],
      },
      {
        partition: 0,
        messages: [
          expect.objectContaining({
            key: 10,
            offset: '40',
            size: 20,
            attributes: 30,
            timestamp: '2020-01-01T00:00:00.000Z',
            value: { stringField: 'AA10', intField: 10 },
          }),
          expect.objectContaining({
            key: 17,
            offset: '47',
            size: 27,
            attributes: 37,
            timestamp: '2020-01-08T00:00:00.000Z',
            value: { stringField: 'AA17', intField: 17 },
          }),
        ],
      },
      {
        partition: 1,
        messages: [
          expect.objectContaining({
            key: 16,
            offset: '46',
            size: 26,
            attributes: 36,
            timestamp: '2020-01-07T00:00:00.000Z',
            value: { stringField: 'AA16', intField: 16 },
          }),
          expect.objectContaining({
            key: 19,
            offset: '49',
            size: 29,
            attributes: 39,
            timestamp: '2020-01-10T00:00:00.000Z',
            value: { stringField: 'AA19', intField: 19 },
          }),
        ],
      },
      {
        partition: 0,
        messages: [
          expect.objectContaining({
            key: 18,
            offset: '48',
            size: 28,
            attributes: 38,
            timestamp: '2020-01-09T00:00:00.000Z',
            value: { stringField: 'AA18', intField: 18 },
          }),
        ],
      },
      {
        partition: 2,
        messages: [
          expect.objectContaining({
            key: 15,
            offset: '45',
            size: 25,
            attributes: 35,
            timestamp: '2020-01-06T00:00:00.000Z',
            value: { stringField: 'AA15', intField: 15 },
          }),
        ],
      },
    ]);
  });
});
