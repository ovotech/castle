import {
  Consumer,
  EachMessagePayload,
  Batch,
  EachBatchPayload,
  Message,
  ProducerRecord,
  TopicMessages,
  ProducerBatch,
  KafkaMessage,
} from 'kafkajs';
import { Schema } from 'avsc';

type Arg1<T> = T extends (arg1: infer U) => any ? U : never;

export interface AvroEachMessagePayload<T = unknown> extends Omit<EachMessagePayload, 'message'> {
  message: AvroKafkaMessage<T>;
}

export interface AvroBatch<T = unknown> extends Omit<Batch, 'messages'> {
  messages: AvroKafkaMessage<T>[];
}

export interface AvroEachBatchPayload<T = unknown> extends Omit<EachBatchPayload, 'batch'> {
  batch: AvroBatch<T>;
}

export type AvroEachMessage<T = unknown> = (payload: AvroEachMessagePayload<T>) => Promise<void>;
export type AvroEachBatch<T = unknown> = (payload: AvroEachBatchPayload<T>) => Promise<void>;

export interface AvroKafkaMessage<T = unknown> extends Omit<KafkaMessage, 'value'> {
  schema: Schema;
  value: T;
}

export interface AvroMessage<T = unknown> extends Omit<Message, 'value'> {
  value: T;
}

export interface AvroProducerRecord<T = unknown> extends Omit<ProducerRecord, 'messages'> {
  schema: Schema;
  messages: AvroMessage<T>[];
}

export interface AvroTopicMessages<T = unknown> extends Omit<TopicMessages, 'messages'> {
  schema: Schema;
  messages: AvroMessage<T>[];
}

export interface AvroProducerBatch extends Omit<ProducerBatch, 'topicMessages'> {
  topicMessages: AvroTopicMessages[];
}

export type AvroConsumerRun<T = unknown> = Omit<
  Arg1<Consumer['run']>,
  'eachBatch' | 'eachMessage'
> & {
  eachBatch?: (payload: AvroEachBatchPayload<T>) => Promise<void>;
  eachMessage?: (payload: AvroEachMessagePayload<T>) => Promise<void>;
};

export type TopicsAlias = { [key: string]: string };
