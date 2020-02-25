import { SchemaRegistry } from './SchemaRegistry';
import {
  Consumer,
  TopicPartitionOffsetAndMedata,
  GroupDescription,
  TopicPartitions,
  ConsumerEvents,
  ValueOf,
  RemoveInstrumentationEventListener,
  KafkaMessage,
} from 'kafkajs';
import { AvroConsumerRun, TopicsAlias } from './types';
import { toAvroEachMessage, toAvroEachBatch, resolveTopic } from './avro';

export class AvroConsumer {
  constructor(
    public schemaRegistry: SchemaRegistry,
    public consumer: Consumer,
    public topicsAlias: TopicsAlias = {},
  ) {}

  public connect(): Promise<void> {
    return this.consumer.connect();
  }

  public disconnect(): Promise<void> {
    return this.consumer.disconnect();
  }

  public subscribe(topic: { topic: string | RegExp; fromBeginning?: boolean }): Promise<void> {
    return this.consumer.subscribe(resolveTopic(topic, this.topicsAlias));
  }

  public stop(): Promise<void> {
    return this.consumer.stop();
  }

  public run<T = unknown, KT = KafkaMessage['key']>(config: AvroConsumerRun<T, KT>): Promise<void> {
    const { eachMessage, eachBatch, encodedKey, ...rest } = config;

    return this.consumer.run({
      ...rest,
      eachMessage: eachMessage
        ? toAvroEachMessage<T, KT>(this.schemaRegistry, eachMessage, encodedKey)
        : undefined,
      eachBatch: eachBatch
        ? toAvroEachBatch<T, KT>(this.schemaRegistry, eachBatch, encodedKey)
        : undefined,
    });
  }

  public commitOffsets(topicPartitions: Array<TopicPartitionOffsetAndMedata>): Promise<void> {
    return this.consumer.commitOffsets(topicPartitions);
  }

  public seek(topicPartition: { topic: string; partition: number; offset: string }): void {
    return this.consumer.seek(resolveTopic(topicPartition, this.topicsAlias));
  }

  public describeGroup(): Promise<GroupDescription> {
    return this.consumer.describeGroup();
  }

  public pause(topics: Array<{ topic: string; partitions?: number[] }>): void {
    return this.consumer.pause(topics.map(topic => resolveTopic(topic, this.topicsAlias)));
  }

  public paused(): TopicPartitions[] {
    return this.consumer.paused();
  }

  public resume(topics: Array<{ topic: string; partitions?: number[] }>): void {
    return this.consumer.resume(topics.map(topic => resolveTopic(topic, this.topicsAlias)));
  }

  public on(
    eventName: ValueOf<ConsumerEvents>,
    listener: (...args: unknown[]) => void,
  ): RemoveInstrumentationEventListener<typeof eventName> {
    return this.consumer.on(eventName, listener);
  }
}
