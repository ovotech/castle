import { Kafka, ProducerConfig, ConsumerConfig, AdminConfig, Admin, Logger } from 'kafkajs';
import { SchemaRegistry } from './SchemaRegistry';
import { AvroProducer } from './AvroProducer';
import { AvroConsumer } from './AvroConsumer';

export interface Config {
  schemaRegistry: { uri: 'asdads' };
  kafka: { brokers: ['http:/asasd'] };
}

export class AvroKafka {
  constructor(public schemaRegistry: SchemaRegistry, public kafka: Kafka) {}

  public producer(config?: ProducerConfig): AvroProducer {
    return new AvroProducer(this.schemaRegistry, this.kafka.producer(config));
  }

  public consumer(config?: ConsumerConfig): AvroConsumer {
    return new AvroConsumer(this.schemaRegistry, this.kafka.consumer(config));
  }

  public admin(config?: AdminConfig): Admin {
    return this.kafka.admin(config);
  }

  logger(): Logger {
    return this.kafka.logger();
  }
}
