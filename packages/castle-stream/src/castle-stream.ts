import { Kafka } from 'kafkajs';
import { AvroKafka, AvroProducer, SchemaRegistry, AvroTransformBatch } from '@ovotech/avro-kafkajs';
import {
  CastleStreamConfig,
  CastleStream,
  CastleStreamConsumer,
  CastleStreamConsumerConfig,
  OptionalCastleStreamConsumerConfig,
} from './types';
import { Readable } from 'stream';
import { ConsumerWritable } from './ConsumerWritable';

const isCastleConsumerConfig = (
  config: OptionalCastleStreamConsumerConfig,
): config is CastleStreamConsumerConfig => Boolean(config.topic);

export const optionalConsumers = (
  configs: OptionalCastleStreamConsumerConfig[],
): CastleStreamConsumerConfig[] => configs.filter(isCastleConsumerConfig);

export const createCastleStream = (config: CastleStreamConfig): CastleStream => {
  const servicesStatus = new Map<Readable | AvroProducer, boolean>();

  const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
  const kafka = new AvroKafka(schemaRegistry, new Kafka(config.kafka), config.topicsAlias);

  const producer = kafka.producer(config.producer);
  servicesStatus.set(producer, false);
  producer.on('producer.connect', () => servicesStatus.set(producer, true));
  producer.on('producer.disconnect', () => servicesStatus.set(producer, false));
  producer.on('producer.network.request', () => servicesStatus.set(producer, true));

  const consumers: CastleStreamConsumer[] = (config.consumers || []).map((config) => {
    const transform = new AvroTransformBatch(config);
    const sink = new ConsumerWritable(producer, config);

    return { transform, sink, config };
  });

  const startConsumers = (): void => {
    consumers.map(({ config, transform, sink }) => {
      config.source
        .pipe(transform)
        .pipe(sink)
        .on('pipe', () => servicesStatus.set(config.source, true))
        .on('unpipe', () => servicesStatus.set(config.source, false));
    });
  };

  const stopConsumers = (): void => {
    consumers.map(({ config, transform, sink }) => {
      config.source.unpipe(transform).unpipe(sink);
    });
  };

  return {
    kafka,
    consumers,
    producer,
    isRunning: () => [...servicesStatus.values()].includes(true),
    start: async () => {
      await producer.connect();
      startConsumers();
    },
    stop: async () => {
      stopConsumers();
      await producer.disconnect();
    },
  };
};
