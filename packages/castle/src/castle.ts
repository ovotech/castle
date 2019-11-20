import { Kafka } from 'kafkajs';
import {
  AvroConsumerRun,
  AvroKafka,
  AvroProducer,
  SchemaRegistry,
  AvroProducerRecord,
} from '@ovotech/avro-kafkajs';
import {
  CastleConsumerConfig,
  CastleConfig,
  Castle,
  CastleConsumer,
  CastleSender,
  CastleEachMessagePayload,
  CastleEachBatchPayload,
} from './types';

const withProducer = (producer: AvroProducer) => ({
  eachBatch,
  eachMessage,
  ...rest
}: CastleConsumerConfig): AvroConsumerRun => ({
  ...rest,
  eachBatch: eachBatch ? payload => eachBatch({ ...payload, producer }) : undefined,
  eachMessage: eachMessage ? payload => eachMessage({ ...payload, producer }) : undefined,
});

export const produce = <T>(config: Omit<AvroProducerRecord<T>, 'messages'>): CastleSender<T> => {
  return (producer, messages) => producer.send<T>({ ...config, messages });
};

export const eachMessage = <T, TContext extends object = {}>(
  config: (payload: CastleEachMessagePayload<T> & TContext) => Promise<void>,
): ((payload: CastleEachMessagePayload<T> & TContext) => Promise<void>) => config;

export const eachBatch = <T, TContext extends object = {}>(
  config: (payload: CastleEachBatchPayload<T> & TContext) => Promise<void>,
): ((payload: CastleEachBatchPayload<T> & TContext) => Promise<void>) => config;

export const createCastle = (config: CastleConfig): Castle => {
  const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
  const kafka = new AvroKafka(schemaRegistry, new Kafka(config.kafka));
  const producer = kafka.producer(config.producer);
  const consumers: CastleConsumer[] = config.consumers.map(config => ({
    instance: kafka.consumer(config),
    config,
  }));

  const services = [producer, ...consumers.map(consumer => consumer.instance)];

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
    start: async () => {
      await Promise.all(services.map(service => service.connect()));
      await run();
    },
    stop: async () => {
      await Promise.all(services.map(service => service.disconnect()));
    },
  };
};
