import { AvroKafkaMessage } from '@ovotech/avro-kafkajs/dist/types';
import avroToJson from '@ovotech/avro-mock-generator';
import {
  CastleEachBatchPayload,
  CastleEachMessagePayload,
} from '@ovotech/castle';
import merge = require('lodash.merge');
import { DeepPartial } from 'ts-essentials';
import { BlaiseDefaults, Blaise } from './types';

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/explicit-function-return-type
const noop = () => {};

/* eslint-disable @typescript-eslint/no-explicit-any */
export const defaultPayload: BlaiseDefaults = {
  eachMessage: {
    topic: 'blaise-default-topic',
    partition: 0,
    producer: noop as any,
  },
  eachBatch: {
    batch: {
      topic: '',
      highWatermark: '',
      partition: 0,
      isEmpty: noop as any,
      firstOffset: noop as any,
      lastOffset: noop as any,
      offsetLag: noop as any,
      offsetLagLow: noop as any,
    },
    isStale: noop as any,
    isRunning: noop as any,
    heartbeat: noop as any,
    uncommittedOffsets: noop as any,
    producer: noop as any,
    resolveOffset: noop as any,
    commitOffsetsIfNecessary: noop as any,
  },
  message: {
    schema: [],
    key: Buffer.from('blaise-default-key'),
    value: {},
    timestamp: Date.now().toString(),
    size: 3,
    attributes: 3,
    offset: '1',
  },
  avro: {
    schema: 'boolean',
  },
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const buildBlaise = <T = unknown>(defaults = defaultPayload): Blaise<T> => {
  const blaise = <T1 = T>(
    newDefaults?: DeepPartial<BlaiseDefaults>,
  ): Blaise<T1> => buildBlaise<T1>(merge({}, defaults, newDefaults));

  blaise.default = blaise;
  blaise.pickUnion = <T1 = T>(pickUnion: Array<string>) =>
    blaise<T1>({ avro: { pickUnion } });

  blaise.getDefault = () => defaults as BlaiseDefaults<T>;

  blaise.message = (
    message?: DeepPartial<AvroKafkaMessage<T>>,
  ): AvroKafkaMessage<T> =>
    merge(
      { value: avroToJson(defaults.avro.schema, defaults.avro) },
      defaults.message,
      message,
    );

  blaise.eachMessage = (
    message?: DeepPartial<AvroKafkaMessage<T>>,
  ): CastleEachMessagePayload<T> => ({
    ...defaults.eachMessage,
    message: blaise.message(message),
  });

  blaise.eachBatch = (
    messages: Array<AvroKafkaMessage<T>> = [],
  ): CastleEachBatchPayload<T> =>
    merge({}, defaults.eachBatch, {
      batch: { messages },
    });

  return blaise;
};

export default buildBlaise();
