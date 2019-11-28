import { SchemaRegistry } from './SchemaRegistry';
import {
  Consumer,
  TopicPartitionOffsetAndMedata,
  GroupDescription,
  TopicPartitions,
  ConsumerEvents,
  ValueOf,
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

  public run<T = unknown>(config?: AvroConsumerRun<T>): Promise<void> {
    return this.consumer.run({
      ...config,
      eachMessage:
        config && config.eachMessage
          ? toAvroEachMessage<T>(this.schemaRegistry, config.eachMessage)
          : undefined,
      eachBatch:
        config && config.eachBatch
          ? toAvroEachBatch<T>(this.schemaRegistry, config.eachBatch)
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

  public on(eventName: ValueOf<ConsumerEvents>, listener: (...args: unknown[]) => void): void {
    return this.consumer.on(eventName, listener);
  }
}
