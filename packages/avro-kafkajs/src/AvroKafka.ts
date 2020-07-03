import { Kafka, ProducerConfig, ConsumerConfig, AdminConfig, Admin, Logger } from 'kafkajs';
import { SchemaRegistry } from './SchemaRegistry';
import { AvroProducer } from './AvroProducer';
import { AvroConsumer } from './AvroConsumer';
import { TopicsAlias } from './types';

export interface Config {
  schemaRegistry: { uri: 'asdads' };
  kafka: { brokers: ['http:/asasd'] };
}

export class AvroKafka {
  public constructor(
    public schemaRegistry: SchemaRegistry,
    public kafka: Kafka,
    public topicsAlias: TopicsAlias = {},
  ) {}

  public producer(config?: ProducerConfig): AvroProducer {
    return new AvroProducer(this.schemaRegistry, this.kafka.producer(config), this.topicsAlias);
  }

  public consumer(config?: ConsumerConfig): AvroConsumer {
    return new AvroConsumer(this.schemaRegistry, this.kafka.consumer(config), this.topicsAlias);
  }

  public admin(config?: AdminConfig): Admin {
    return this.kafka.admin(config);
  }

  public logger(): Logger {
    return this.kafka.logger();
  }

  public resolveTopic(alias: string): string | undefined {
    return this.topicsAlias[alias];
  }
}
