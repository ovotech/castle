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
  FinalCastleConsumerConfig,
} from './types';
import { withEachSizedBatch } from './each-sized-batch';

const withProducer = <T = unknown>(producer: AvroProducer) => (
  config: FinalCastleConsumerConfig<T>,
): AvroConsumerRun<T> => {
  if ('eachBatch' in config) {
    return { ...config, eachBatch: payload => config.eachBatch({ ...payload, producer }) };
  } else {
    return { ...config, eachMessage: payload => config.eachMessage({ ...payload, producer }) };
  }
};

export const produce = <T>(config: Omit<AvroProducerRecord<T>, 'messages'>): CastleSender<T> => {
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
    const finalConfig = toFinalCastleConsumerConfig(config);
    return { instance: kafka.consumer(finalConfig), config: finalConfig };
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
