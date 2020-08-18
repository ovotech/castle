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
  ConsumerSubscribeTopic,
  KafkaMessage,
} from 'kafkajs';

export interface CastleEachMessagePayload<TValue = unknown, TKey = KafkaMessage['key']>
  extends AvroEachMessagePayload<TValue, TKey> {
  producer: AvroProducer;
}

export interface CastleEachBatchPayload<TValue = unknown, TKey = KafkaMessage['key']>
  extends AvroEachBatchPayload<TValue, TKey> {
  producer: AvroProducer;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Resolver<TContext extends {} = {}> = (ctx: TContext) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Middleware<TP extends {} = {}, TR extends {} = {}> = <TInherit extends {} = {}>(
  next: Resolver<TP & TR & TInherit>,
) => Resolver<TR & TInherit>;

export interface CastleTopicSubscribeEachMessage<TValue, TKey> {
  eachMessage: (ctx: CastleEachMessagePayload<TValue, TKey>) => Promise<void>;
}

export interface CastleTopicSubscribeEachBatch<TValue, TKey> {
  eachBatch: (ctx: CastleEachBatchPayload<TValue, TKey>) => Promise<void>;
}

export interface CastleTopicSubscribeEachSizedBatch<TValue, TKey> {
  eachSizedBatch: (ctx: CastleEachBatchPayload<TValue, TKey>) => Promise<void>;
  maxBatchSize: number;
}

export type FinalCastleTopicSubscribe<TValue, TKey> =
  | CastleTopicSubscribeEachMessage<TValue, TKey>
  | CastleTopicSubscribeEachBatch<TValue, TKey>;

export type CastleConsumerRun = Omit<AvroConsumerRun, 'eachBatch' | 'eachMessage'>;
export type CastleTopicSubscribe<TValue, TKey> =
  | CastleTopicSubscribeEachMessage<TValue, TKey>
  | CastleTopicSubscribeEachBatch<TValue, TKey>
  | CastleTopicSubscribeEachSizedBatch<TValue, TKey>;

export interface CastleConsumerSubscribeTopic extends Omit<ConsumerSubscribeTopic, 'topic'> {
  topic?: ConsumerSubscribeTopic['topic'];
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type CastleConsumerConfig<TValue = any, TKey = any> = ConsumerConfig &
  CastleConsumerRun &
  ConsumerSubscribeTopic &
  CastleTopicSubscribe<TValue, TKey>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type OptionalCastleConsumerConfig<TValue = any, TKey = any> = ConsumerConfig &
  CastleConsumerRun &
  CastleConsumerSubscribeTopic &
  CastleTopicSubscribe<TValue, TKey>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type FinalCastleConsumerConfig<TValue = any, TKey = any> = ConsumerConfig &
  CastleConsumerRun &
  ConsumerSubscribeTopic &
  FinalCastleTopicSubscribe<TValue, TKey>;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export interface CastleConsumer<TValue = any, TKey = any> {
  instance: AvroConsumer;
  config: FinalCastleConsumerConfig<TValue, TKey>;
}

export interface CastleConfig {
  kafka: KafkaConfig;
  topicsAlias?: TopicsAlias;
  producer?: ProducerConfig;
  schemaRegistry: SchemaRegistryConfig;
  consumers?: CastleConsumerConfig[];
}

export interface CastleParts {
  kafka: AvroKafka;
  producer: AvroProducer;
  consumers: CastleConsumer[];
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

export type CastleSender<TValue = unknown, TKey = AvroMessage['key']> = (
  producer: AvroProducer,
  messages: AvroMessage<TValue, TKey>[],
) => Promise<RecordMetadata[]>;
