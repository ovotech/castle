import {
  AvroProducer,
  AvroEachMessagePayload,
  AvroEachBatchPayload,
  SchemaRegistryConfig,
  AvroConsumer,
  AvroMessage,
  AvroKafka,
} from '@ovotech/avro-kafkajs';
import { ConsumerConfig, KafkaConfig, ProducerConfig, RecordMetadata, AdminConfig } from 'kafkajs';

export interface CastleEachMessagePayload<T = unknown> extends AvroEachMessagePayload<T> {
  producer: AvroProducer;
}

export interface CastleEachBatchPayload<T = unknown> extends AvroEachBatchPayload<T> {
  producer: AvroProducer;
}

export type Resolver<TContext extends object = {}> = (ctx: TContext) => Promise<void>;

export type Middleware<TProvide extends object = {}, TRequire extends object = {}> = <
  TInherit extends CastleEachMessagePayload = CastleEachMessagePayload
>(
  next: Resolver<TProvide & TRequire & TInherit>,
) => Resolver<TRequire & TInherit>;

export interface CastleConsumerConfig<T = any> extends ConsumerConfig {
  topic: string | RegExp;
  fromBeginning?: boolean;
  partitionsConsumedConcurrently?: number;
  eachBatch?: (ctx: CastleEachBatchPayload<T>) => Promise<void>;
  eachMessage?: (ctx: CastleEachMessagePayload<T>) => Promise<void>;
}

export interface CastleConsumer<T = any> {
  instance: AvroConsumer;
  config: CastleConsumerConfig<T>;
}

export interface CastleConfig {
  kafka: KafkaConfig;
  producer?: ProducerConfig;
  admin?: AdminConfig;
  schemaRegistry: SchemaRegistryConfig;
  consumers: CastleConsumerConfig[];
}

export interface CastleService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface Castle {
  kafka: AvroKafka;
  consumers: CastleConsumer[];
  producer: AvroProducer;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export type CastleSender<T = unknown> = (
  producer: AvroProducer,
  messages: AvroMessage<T>[],
) => Promise<RecordMetadata[]>;