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
import { eachSizedBatch } from './each-sized-batch';

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

export const consumeEachMessage = <T, TContext extends object = {}>(
  config: (payload: CastleEachMessagePayload<T> & TContext) => Promise<void>,
): ((payload: CastleEachMessagePayload<T> & TContext) => Promise<void>) => config;

export const consumeEachBatch = <T, TContext extends object = {}>(
  config: (payload: CastleEachBatchPayload<T> & TContext) => Promise<void>,
): ((payload: CastleEachBatchPayload<T> & TContext) => Promise<void>) => config;

export const createCastle = (config: CastleConfig): Castle => {
  const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
  const kafka = new AvroKafka(schemaRegistry, new Kafka(config.kafka), config.topicsAlias);
  const producer = kafka.producer(config.producer);
  const consumers: CastleConsumer[] = config.consumers.map(config => {
    let consumerConfig: CastleConsumerConfig;
    if (config.eachSizedBatch) {
      if (config.eachBatch) {
        throw new Error('Invalid configuration, please choose one of eachSizedBatch and eachBatch');
      }
      consumerConfig = eachSizedBatch(config);
    } else {
      consumerConfig = config;
    }
    return {
      instance: kafka.consumer(consumerConfig),
      config: consumerConfig,
    };
  });

  const services = [producer, ...consumers.map(consumer => consumer.instance)];
  let running = false;

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
    isRunning: () => running,
    start: async () => {
      await Promise.all(services.map(service => service.connect()));
      await run();
      running = true;
    },
    stop: async () => {
      await Promise.all(services.map(service => service.disconnect()));
      running = false;
    },
  };
};
