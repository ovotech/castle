/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AvroKafka,
  AvroProducer,
  SchemaRegistryConfig,
  TopicsAlias,
  AvroTransformBatch,
  AvroTransformBatchConfig,
} from '@ovotech/avro-kafkajs';
import { Readable, Writable } from 'stream';
import { KafkaConfig, ProducerConfig } from 'kafkajs';
import { CastleEachMessagePayload, CastleEachBatchPayload } from '@ovotech/castle';

export interface CastleStream {
  kafka: AvroKafka;
  producer: AvroProducer;
  consumers: CastleStreamConsumer[];
  isRunning: () => boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface CastleStreamConfig {
  kafka: KafkaConfig;
  topicsAlias?: TopicsAlias;
  producer?: ProducerConfig;
  schemaRegistry: SchemaRegistryConfig;
  consumers?: CastleStreamConsumerConfig[];
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export interface CastleStreamConsumer<TMessage = any, TValue = any, TKey = any> {
  transform: AvroTransformBatch;
  sink: Writable;
  config: CastleStreamConsumerConfig<TMessage, TValue, TKey>;
}

export interface CastleStreamTopicSubscribeEachMessage<TValue, TKey> {
  eachMessage: (ctx: CastleEachMessagePayload<TValue, TKey>) => Promise<void>;
}

export interface CastleStreamTopicSubscribeEachBatch<TValue, TKey> {
  eachBatch: (ctx: CastleEachBatchPayload<TValue, TKey>) => Promise<void>;
}

export interface CastleStreamConsumerRun<TMessage = unknown, TValue = unknown, Tkey = unknown>
  extends AvroTransformBatchConfig<TMessage, TValue, Tkey> {
  source: Readable;
}

export interface CastleStreamConsumerSubscribeRun {
  topic: string;
}

export interface OptionalCastleStreamConsumerSubscribeRun {
  topic?: string;
}

export type CastleStreamTopicSubscribe<TValue, TKey> =
  | CastleStreamTopicSubscribeEachMessage<TValue, TKey>
  | CastleStreamTopicSubscribeEachBatch<TValue, TKey>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type CastleStreamConsumerConfig<
  TMessage = any,
  TValue = any,
  TKey = any
> = CastleStreamConsumerSubscribeRun &
  CastleStreamConsumerRun<TMessage, TValue, TKey> &
  CastleStreamTopicSubscribe<TValue, TKey>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type OptionalCastleStreamConsumerConfig<
  TMessage = any,
  TValue = any,
  TKey = any
> = OptionalCastleStreamConsumerSubscribeRun &
  CastleStreamConsumerRun<TMessage, TValue, TKey> &
  CastleStreamTopicSubscribe<TValue, TKey>;
