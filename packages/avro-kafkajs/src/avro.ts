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
  TopicsAlias,
} from './types';
import {
  Message,
  ProducerRecord,
  ProducerBatch,
  TopicMessages,
  EachMessagePayload,
  EachBatchPayload,
  KafkaMessage,
} from 'kafkajs';

export const encodeMessages = async <T = unknown, KT = unknown>({
  schemaRegistry,
  schema,
  keySchema,
  topic,
  avroMessages,
}: {
  schemaRegistry: SchemaRegistry;
  schema: Schema;
  keySchema?: Schema;
  topic: string;
  avroMessages: AvroMessage<T, KT>[];
}): Promise<Message[]> => {
  const messages: Message[] = [];

  for (const message of avroMessages) {
    messages.push({
      ...message,
      key:
        keySchema && message.key
          ? await schemaRegistry.encode<KT>(topic, 'key', keySchema, message.key)
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (message.key as any),
      value: await schemaRegistry.encode<T>(topic, 'value', schema, message.value),
    });
  }
  return messages;
};

export const toProducerRecord = async <T = unknown, KT = Message['key']>(
  schemaRegistry: SchemaRegistry,
  record: AvroProducerRecord<T, KT>,
): Promise<ProducerRecord> => {
  const { messages: avroMessages, schema, keySchema, topic, ...rest } = record;
  const messages = await encodeMessages<T, KT>({
    schemaRegistry,
    schema,
    keySchema,
    topic,
    avroMessages,
  });

  return { ...rest, topic, messages };
};

export const toProducerBatch = async (
  schemaRegistry: SchemaRegistry,
  record: AvroProducerBatch,
): Promise<ProducerBatch> => {
  const topicMessages: TopicMessages[] = [];
  const { topicMessages: avroTopicMessages, ...rest } = record;
  for (const item of avroTopicMessages) {
    const { messages: avroMessages, schema, keySchema, topic } = item;
    const messages = await encodeMessages({
      schemaRegistry,
      schema,
      keySchema,
      topic,
      avroMessages,
    });
    topicMessages.push({ messages, topic });
  }
  return { ...rest, topicMessages };
};

export const toAvroEachMessage = <T = unknown, KT = KafkaMessage['key']>(
  schemaRegistry: SchemaRegistry,
  eachMessage: AvroEachMessage<T, KT>,
  encodedKey?: boolean,
): ((payload: EachMessagePayload) => Promise<void>) => {
  return async payload => {
    const { type, value } = await schemaRegistry.decodeWithType<T>(payload.message.value);
    const key =
      encodedKey && payload.message.key
        ? await schemaRegistry.decode<KT>(payload.message.key)
        : payload.message.key;

    return eachMessage({
      ...payload,
      message: {
        ...payload.message,
        key: key as KT,
        value,
        rawValue: payload.message.value,
        schema: type.schema(),
      },
    });
  };
};

export const toAvroEachBatch = <T = unknown, KT = KafkaMessage['key']>(
  schemaRegistry: SchemaRegistry,
  eachBatch: AvroEachBatch<T, KT>,
  encodedKey?: boolean,
): ((payload: EachBatchPayload) => Promise<void>) => {
  return async payload => {
    const avroPayload = (payload as unknown) as AvroEachBatchPayload<T, KT>;
    const messages: AvroKafkaMessage<T, KT>[] = [];
    for (const message of payload.batch.messages) {
      const { value, type } = await schemaRegistry.decodeWithType<T>(message.value);
      const key =
        encodedKey && message.key ? await schemaRegistry.decode<KT>(message.key) : message.key;

      messages.push({
        ...message,
        key: key as KT,
        value,
        rawValue: message.value,
        schema: type.schema(),
      });
    }
    avroPayload.batch.messages = messages;
    return eachBatch(avroPayload);
  };
};

export const resolveTopic = <T extends { topic: unknown }>(
  record: T,
  topicsAlias: TopicsAlias,
): T => ({
  ...record,
  topic:
    typeof record.topic === 'string' && topicsAlias[record.topic]
      ? topicsAlias[record.topic]
      : record.topic,
});
