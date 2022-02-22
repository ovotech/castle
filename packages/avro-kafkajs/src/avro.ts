import { SchemaRegistry, DecodeItemParams } from './SchemaRegistry';
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
  avroMessages,
  ...params
}: {
  schemaRegistry: SchemaRegistry;
  avroMessages: AvroMessage<T, KT>[];
} & (
  | { schema: Schema; keySchema?: Schema; topic: string }
  | { subject: string; keySubject?: string }
)): Promise<Message[]> => {
  const messages: Message[] = [];

  const keyParams: DecodeItemParams | undefined =
    'subject' in params
      ? params.keySubject
        ? { subject: params.keySubject }
        : undefined
      : params.keySchema
      ? { topic: params.topic, schemaType: 'key', schema: params.keySchema }
      : undefined;

  const valueParams: DecodeItemParams =
    'subject' in params
      ? { subject: params.subject }
      : { topic: params.topic, schemaType: 'value', schema: params.schema };

  for (const message of avroMessages) {
    messages.push({
      ...message,
      key:
        keyParams && message.key
          ? await schemaRegistry.encode<KT>({ ...keyParams, value: message.key })
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (message.key as any),
      value: await schemaRegistry.encode<T>({ ...valueParams, value: message.value }),
    });
  }
  return messages;
};

export const toProducerRecord = async <T = unknown, KT = Message['key']>(
  schemaRegistry: SchemaRegistry,
  record: AvroProducerRecord<T, KT>,
): Promise<ProducerRecord> => {
  const { messages: avroMessages, ...rest } = record;
  const messages = await encodeMessages<T, KT>({ schemaRegistry, avroMessages, ...rest });

  return { ...rest, messages };
};

export const toProducerBatch = async (
  schemaRegistry: SchemaRegistry,
  record: AvroProducerBatch,
): Promise<ProducerBatch> => {
  const topicMessages: TopicMessages[] = [];
  const { topicMessages: avroTopicMessages, ...rest } = record;
  for (const item of avroTopicMessages) {
    const { messages: avroMessages, ...itemRest } = item;
    const messages = await encodeMessages({ schemaRegistry, avroMessages, ...itemRest });
    topicMessages.push({ ...itemRest, messages });
  }
  return { ...rest, topicMessages };
};

export const toAvroEachMessage = <T = unknown, KT = KafkaMessage['key']>(
  schemaRegistry: SchemaRegistry,
  eachMessage: AvroEachMessage<T, KT>,
  encodedKey?: boolean,
  readerSchema?: Schema,
  skipCorrupted=false
) => {
  return async (payload: EachMessagePayload): Promise<void> => {
    try {
      const key =
        encodedKey && payload.message.key
          ? await schemaRegistry.decode<KT>(payload.message.key)
          : payload.message.key;

      if (payload.message.value !== null && payload.message.value.length !== 0) {
        const { type, value } = await schemaRegistry.decodeWithType<T>(
          payload.message.value,
          readerSchema,
        );

        return eachMessage({
          ...payload,
          message: { ...payload.message, key: key as KT, value, schema: type.schema() },
        });
      } else {
        return eachMessage({
          ...payload,
          message: { ...payload.message, key: key as KT, value: null, schema: null },
        });
      }
    } catch (error) {
      if (skipCorrupted) {
        return
      }
      throw error
    }
  };
};

export const toAvroEachBatch = <T = unknown, KT = KafkaMessage['key']>(
  schemaRegistry: SchemaRegistry,
  eachBatch: AvroEachBatch<T, KT>,
  encodedKey?: boolean,
  readerSchema?: Schema,
  skipCorrupted=false
) => {
  return async (payload: EachBatchPayload): Promise<void> => {
    try {
      const avroPayload = (payload as unknown) as AvroEachBatchPayload<T, KT>;
      const messages: AvroKafkaMessage<T, KT>[] = [];
      for (const message of payload.batch.messages) {
        const key =
          encodedKey && message.key
            ? await schemaRegistry.decode<KT>(message.key, readerSchema)
            : message.key;

        if (message.value !== null) {
          const { value, type } = await schemaRegistry.decodeWithType<T>(message.value);

          messages.push({ ...message, key: key as KT, value, schema: type.schema() });
        } else {
          messages.push({ ...message, key: key as KT, value: null, schema: null });
        }
      }

      avroPayload.batch.messages = messages;
      return eachBatch(avroPayload);
    } catch (error) {
      if (skipCorrupted) {
        return
      }
      throw error
    }
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
