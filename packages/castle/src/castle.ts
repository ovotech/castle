import { Kafka, KafkaMessage, ProducerRecord, ProducerConfig } from 'kafkajs';
import {
  AvroConsumerRun,
  AvroKafka,
  AvroProducer,
  SchemaRegistry,
  AvroConsumer,
  AvroProducerRecordSchema,
} from '@ovotech/avro-kafkajs';
import {
  CastleConsumerConfig,
  CastleConfig,
  Castle,
  CastleConsumer,
  CastleSender,
  CastleEachMessagePayload,
  CastleEachBatchPayload,
  FinalCastleConsumerConfig,
  OptionalCastleConsumerConfig,
  CastleParts,
} from './types';
import { withEachSizedBatch } from './each-sized-batch';

const withProducer = <TValue = unknown, TKey = KafkaMessage['key']>(producer: AvroProducer) => (
  config: FinalCastleConsumerConfig<TValue, TKey>,
): AvroConsumerRun<TValue, TKey> => {
  if ('eachBatch' in config) {
    return { ...config, eachBatch: (payload) => config.eachBatch({ ...payload, producer }) };
  } else {
    return { ...config, eachMessage: (payload) => config.eachMessage({ ...payload, producer }) };
  }
};

export const produce = <T>(
  config: Omit<ProducerRecord, 'messages'> & AvroProducerRecordSchema,
): CastleSender<T> => {
  config;
  return (producer, messages) => producer.send<T>({ ...config, messages });
};

export const toFinalCastleConsumerConfig = (
  config: CastleConsumerConfig,
): FinalCastleConsumerConfig => {
  if ('eachSizedBatch' in config) {
    const { eachSizedBatch, maxBatchSize, ...rest } = config;
    return { ...rest, eachBatch: withEachSizedBatch(eachSizedBatch, maxBatchSize) };
  } else {
    return config;
  }
};

const isCastleConsumerConfig = (
  config: OptionalCastleConsumerConfig,
): config is CastleConsumerConfig => Boolean(config.topic);

export const optionalConsumers = (
  configs: OptionalCastleConsumerConfig[],
): CastleConsumerConfig[] => configs.filter(isCastleConsumerConfig);

export const consumeEachMessage = <
  TValue,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TContext extends {} = {},
  TKey = KafkaMessage['key']
>(
  config: (payload: CastleEachMessagePayload<TValue, TKey> & TContext) => Promise<void>,
): ((payload: CastleEachMessagePayload<TValue, TKey> & TContext) => Promise<void>) => config;

// eslint-disable-next-line @typescript-eslint/ban-types
export const consumeEachBatch = <TValue, TContext extends {} = {}, TKey = KafkaMessage['key']>(
  config: (payload: CastleEachBatchPayload<TValue, TKey> & TContext) => Promise<void>,
): ((payload: CastleEachBatchPayload<TValue, TKey> & TContext) => Promise<void>) => config;

export const createKafka = (config: CastleConfig): AvroKafka => {
  const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
  return new AvroKafka(schemaRegistry, new Kafka(config.kafka), config.topicsAlias);
};

export const createProducer = (kafka: AvroKafka, config?: ProducerConfig): AvroProducer =>
  kafka.producer(config);

export const createConsumers = (
  kafka: AvroKafka,
  config: CastleConsumerConfig[],
): CastleConsumer[] =>
  config.map((consumerConfig) => {
    const finalConfig = toFinalCastleConsumerConfig(consumerConfig);
    const instance = kafka.consumer(finalConfig);
    return { instance, config: finalConfig };
  });

export const toCastleParts = (config: CastleConfig): CastleParts => {
  const kafka = createKafka(config);
  return {
    kafka,
    producer: createProducer(kafka, config.producer),
    consumers: createConsumers(kafka, config.consumers ?? []),
  };
};

export const createCastleFromParts = (parts: CastleParts): Castle => {
  const servicesStatus = new Map<AvroConsumer | AvroProducer, boolean>();
  const { producer, consumers, kafka } = parts;
  servicesStatus.set(producer, false);
  producer.on('producer.connect', () => servicesStatus.set(producer, true));
  producer.on('producer.disconnect', () => servicesStatus.set(producer, false));
  producer.on('producer.network.request', () => servicesStatus.set(producer, true));

  for (const consumer of consumers) {
    servicesStatus.set(consumer.instance, false);
    consumer.instance.on('consumer.connect', () => servicesStatus.set(consumer.instance, true));
    consumer.instance.on('consumer.disconnect', () => servicesStatus.set(consumer.instance, false));
  }

  const run = async (): Promise<void> => {
    await Promise.all(
      consumers.map(async ({ instance, config }) => {
        await instance.subscribe(config);
        await instance.run(withProducer(producer)(config));
      }),
    );
  };

  return {
    kafka,
    consumers,
    producer,
    isRunning: () => [...servicesStatus.values()].includes(true),
    start: async () => {
      await Promise.all([...servicesStatus.keys()].map((service) => service.connect()));
      await run();
    },
    stop: async () => {
      await Promise.all([...servicesStatus.keys()].map((service) => service.disconnect()));
    },
  };
};

export const createCastle = (config: CastleConfig): Castle =>
  createCastleFromParts(toCastleParts(config));
