import { SchemaRegistry } from './SchemaRegistry';
import {
  Consumer,
  TopicPartitionOffsetAndMedata,
  GroupDescription,
  TopicPartitions,
} from 'kafkajs';
import { AvroConsumerRun } from './types';
import { toAvroEachMessage, toAvroEachBatch } from './avro';

export class AvroConsumer {
  constructor(public schemaRegistry: SchemaRegistry, public consumer: Consumer) {}

  public connect(): Promise<void> {
    return this.consumer.connect();
  }

  public disconnect(): Promise<void> {
    return this.consumer.disconnect();
  }

  public subscribe(topic: { topic: string | RegExp; fromBeginning?: boolean }): Promise<void> {
    return this.consumer.subscribe(topic);
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
    return this.consumer.seek(topicPartition);
  }

  public describeGroup(): Promise<GroupDescription> {
    return this.consumer.describeGroup();
  }

  public pause(topics: Array<{ topic: string; partitions?: number[] }>): void {
    return this.pause(topics);
  }

  public paused(): TopicPartitions[] {
    return this.consumer.paused();
  }

  public resume(topics: Array<{ topic: string; partitions?: number[] }>): void {
    return this.consumer.resume(topics);
  }
}
