import { SchemaRegistry } from './SchemaRegistry';
import { Schema } from 'avsc';
import {
  AvroMessage,
  AvroProducerRecord,
  AvroProducerBatch,
  AvroEachMessage,
  AvroEachBatch,
  AvroKafkaMessage,
  AvroEachBatchPayload,
} from './types';
import {
  Message,
  ProducerRecord,
  ProducerBatch,
  TopicMessages,
  EachMessagePayload,
  EachBatchPayload,
} from 'kafkajs';

export const encodeMessages = async <T = unknown>(
  schemaRegistry: SchemaRegistry,
  schema: Schema,
  topic: string,
  avroMessages: AvroMessage<T>[],
): Promise<Message[]> => {
  const messages: Message[] = [];

  for (const message of avroMessages) {
    messages.push({
      ...message,
      value: await schemaRegistry.encode<T>(topic, schema, message.value),
    });
  }
  return messages;
};

export const toProducerRecord = async <T = unknown>(
  schemaRegistry: SchemaRegistry,
  record: AvroProducerRecord<T>,
): Promise<ProducerRecord> => {
  const { messages: avroMessages, schema, topic, ...rest } = record;
  const messages = await encodeMessages<T>(schemaRegistry, schema, topic, avroMessages);

  return { ...rest, topic, messages };
};

export const toProducerBatch = async (
  schemaRegistry: SchemaRegistry,
  record: AvroProducerBatch,
): Promise<ProducerBatch> => {
  const topicMessages: TopicMessages[] = [];
  const { topicMessages: avroTopicMessages, ...rest } = record;
  for (const item of avroTopicMessages) {
    const { messages: avroMessages, schema, topic } = item;
    const messages = await encodeMessages(schemaRegistry, schema, topic, avroMessages);
    topicMessages.push({ messages, topic });
  }
  return { ...rest, topicMessages };
};

export const toAvroEachMessage = <T = unknown>(
  schemaRegistry: SchemaRegistry,
  eachMessage: AvroEachMessage<T>,
): ((payload: EachMessagePayload) => Promise<void>) => {
  return async payload => {
    const { type, value } = await schemaRegistry.decodeWithType<T>(payload.message.value);
    eachMessage({ ...payload, message: { ...payload.message, value, schema: type.schema() } });
  };
};

export const toAvroEachBatch = <T = unknown>(
  schemaRegistry: SchemaRegistry,
  eachBatch: AvroEachBatch<T>,
): ((payload: EachBatchPayload) => Promise<void>) => {
  return async payload => {
    const avroPayload = (payload as unknown) as AvroEachBatchPayload<T>;
    const messages: AvroKafkaMessage<T>[] = [];
    for (const message of payload.batch.messages) {
      const { value, type } = await schemaRegistry.decodeWithType<T>(message.value);
      messages.push({ ...message, value, schema: type.schema() });
    }
    avroPayload.batch.messages = messages;
    eachBatch(avroPayload);
  };
};
