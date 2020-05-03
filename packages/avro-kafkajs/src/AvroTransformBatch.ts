import { Transform, TransformCallback } from 'stream';
import { AvroKafkaMessage, AvroEachBatchPayload, AvroBatch, Optional } from './types';
import * as Long from 'long';

export type ToPartition<TMessage = unknown> = (message: TMessage) => number;
export type ToKafkaMessage<TMessage = unknown, TValue = unknown, TKey = unknown> = (
  message: TMessage,
) => Optional<AvroKafkaMessage<TValue, TKey>, 'attributes' | 'timestamp' | 'size' | 'offset'>;

export interface AvroTransformBatchConfig<TMessage = unknown, TValue = unknown, TKey = unknown> {
  highWaterMark?: number;
  partitionHighWaterMark?: number;
  topic: string;
  toPartition?: ToPartition<TMessage>;
  toKafkaMessage: ToKafkaMessage<TMessage, TValue, TKey>;
}

const toAvroTransformBatch = <TValue, TKey>(
  topic: string,
  partition: number,
  messages: AvroKafkaMessage<TValue, TKey>[],
): AvroBatch<TValue, TKey> => {
  const offsets = messages.map((message) => Long.fromValue(message.offset));
  const fetchedOffset = offsets
    .reduce((left, right) => (left.lessThan(right) ? left : right))
    .toString();
  const highWatermark = offsets
    .reduce((left, right) => (left.greaterThan(right) ? left : right))
    .toString();

  const isEmpty = (): boolean => messages.length === 0;
  const firstOffset = (): string => fetchedOffset;
  const lastOffset = (): string => highWatermark;

  return {
    topic,
    partition,
    highWatermark,
    messages,
    isEmpty,
    firstOffset,
    lastOffset,
    offsetLag: () => {
      const lastOffsetOfPartition = Long.fromValue(highWatermark).add(-1);
      const lastConsumedOffset = Long.fromValue(lastOffset());
      return lastOffsetOfPartition.add(lastConsumedOffset.multiply(-1)).toString();
    },
    offsetLagLow: () => {
      if (isEmpty()) {
        return '0';
      }

      const lastOffsetOfPartition = Long.fromValue(highWatermark).add(-1);
      const firstConsumedOffset = Long.fromValue(firstOffset());
      return lastOffsetOfPartition.add(firstConsumedOffset.multiply(-1)).toString();
    },
  };
};

const toAvroBatch = <TValue, TKey>(
  partition: number,
  topic: string,
  messages: AvroKafkaMessage<TValue, TKey>[],
): AvroEachBatchPayload<TValue, TKey> => ({
  batch: toAvroTransformBatch(topic, partition, messages),
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resolveOffset: () => {},
  heartbeat: () => Promise.resolve(),
  commitOffsetsIfNecessary: () => Promise.resolve(),
  uncommittedOffsets: () => Promise.resolve({ topics: [] }),
  isRunning: () => true,
  isStale: () => false,
});

/**
 * Converts a stream of messages into batch payloads
 */
export class AvroTransformBatch<
  TMessage = unknown,
  TValue = unknown,
  TKey = unknown
> extends Transform {
  public partitionHighWaterMark: number;
  public topic: string;
  public partitionBuffers = new Map<
    number,
    { messages: AvroKafkaMessage<TValue, TKey>[]; offset: Long }
  >();
  private toPartition: ToPartition<TMessage> | undefined;
  private toKafkaMessage: ToKafkaMessage<TMessage, TValue, TKey>;

  constructor({
    partitionHighWaterMark,
    toPartition,
    toKafkaMessage,
    topic,
    highWaterMark,
  }: AvroTransformBatchConfig<TMessage, TValue, TKey>) {
    super({ highWaterMark, objectMode: true });
    this.partitionHighWaterMark = partitionHighWaterMark ?? 10000;
    this.toPartition = toPartition;
    this.toKafkaMessage = toKafkaMessage;
    this.topic = topic;
  }

  add(
    partition: number,
    message: TMessage,
  ): { messages: AvroKafkaMessage<TValue, TKey>[]; offset: Long } {
    const buffer = this.partitionBuffers.get(partition) ?? {
      offset: Long.fromNumber(0),
      messages: [],
    };
    const offset = buffer.offset;
    const partialKafkaMessage = this.toKafkaMessage(message);
    const kafkaMessage = {
      ...partialKafkaMessage,
      size: partialKafkaMessage.size ?? 0,
      attributes: partialKafkaMessage.attributes ?? 0,
      offset: partialKafkaMessage.offset ?? offset.toString(),
      timestamp: partialKafkaMessage.timestamp ?? new Date().toISOString(),
    };
    buffer.offset = offset.add(1);
    buffer.messages.push(kafkaMessage);
    this.partitionBuffers.set(partition, buffer);
    return buffer;
  }

  async _final(callback: TransformCallback): Promise<void> {
    for (const [partition, buffer] of this.partitionBuffers.entries()) {
      if (buffer.messages.length > 0) {
        this.push(toAvroBatch(partition, this.topic, buffer.messages));
      }
    }
    callback();
  }

  async _transform(
    message: TMessage,
    encoding: string,
    callback: TransformCallback,
  ): Promise<void> {
    try {
      const partition = this.toPartition ? this.toPartition(message) : 0;
      const buffer = this.add(partition, message);

      if (buffer.messages.length >= this.partitionHighWaterMark) {
        this.push(toAvroBatch(partition, this.topic, buffer.messages));
        buffer.messages = [];
        this.partitionBuffers.set(partition, buffer);
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
