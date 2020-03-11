import {
  AvroProducer,
  AvroEachMessagePayload,
  AvroEachBatchPayload,
  SchemaRegistryConfig,
  AvroConsumer,
  AvroConsumerRun,
  AvroMessage,
  AvroKafka,
  TopicsAlias,
} from '@ovotech/avro-kafkajs';
import {
  ConsumerConfig,
  KafkaConfig,
  ProducerConfig,
  RecordMetadata,
  AdminConfig,
  ConsumerSubscribeTopic,
} from 'kafkajs';

export interface CastleEachMessagePayload<T = unknown> extends AvroEachMessagePayload<T> {
  producer: AvroProducer;
}

export interface CastleEachBatchPayload<T = unknown> extends AvroEachBatchPayload<T> {
  producer: AvroProducer;
}

export type Resolver<TContext extends object = {}> = (ctx: TContext) => Promise<void>;

export type Middleware<TProvide extends object = {}, TRequire extends object = {}> = <
  TInherit extends object = {}
>(
  next: Resolver<TProvide & TRequire & TInherit>,
) => Resolver<TRequire & TInherit>;

export interface CastleTopicSubscribeEachMessage<T> {
  eachMessage: (ctx: CastleEachMessagePayload<T>) => Promise<void>;
}

export interface CastleTopicSubscribeEachBatch<T> {
  eachBatch: (ctx: CastleEachBatchPayload<T>) => Promise<void>;
}

export interface CastleTopicSubscribeEachSizedBatch<T> {
  eachSizedBatch: (ctx: CastleEachBatchPayload<T>) => Promise<void>;
  maxBatchSize: number;
}

export type FinalCastleTopicSubscribe<T> =
  | CastleTopicSubscribeEachMessage<T>
  | CastleTopicSubscribeEachBatch<T>;

export type CastleConsumerRun = Omit<AvroConsumerRun, 'eachBatch' | 'eachMessage'>;
export type CastleTopicSubscribe<T> =
  | CastleTopicSubscribeEachMessage<T>
  | CastleTopicSubscribeEachBatch<T>
  | CastleTopicSubscribeEachSizedBatch<T>;

export interface CastleConsumerSubscribeTopic extends Omit<ConsumerSubscribeTopic, 'topic'> {
  topic?: ConsumerSubscribeTopic['topic'];
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type CastleConsumerConfig<T = any> = ConsumerConfig &
  CastleConsumerRun &
  ConsumerSubscribeTopic &
  CastleTopicSubscribe<T>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type OptionalCastleConsumerConfig<T = any> = ConsumerConfig &
  CastleConsumerRun &
  CastleConsumerSubscribeTopic &
  CastleTopicSubscribe<T>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type FinalCastleConsumerConfig<T = any> = ConsumerConfig &
  CastleConsumerRun &
  ConsumerSubscribeTopic &
  FinalCastleTopicSubscribe<T>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export interface CastleConsumer<T = any> {
  instance: AvroConsumer;
  config: FinalCastleConsumerConfig<T>;
}

export interface CastleConfig {
  kafka: KafkaConfig;
  topicsAlias?: TopicsAlias;
  producer?: ProducerConfig;
  admin?: AdminConfig;
  schemaRegistry: SchemaRegistryConfig;
  consumers?: CastleConsumerConfig[];
}

export interface CastleService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface Castle {
  kafka: AvroKafka;
  consumers: CastleConsumer[];
  producer: AvroProducer;
  isRunning: () => boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export type CastleSender<T = unknown> = (
  producer: AvroProducer,
  messages: AvroMessage<T>[],
) => Promise<RecordMetadata[]>;
