import * as command from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from './config';
import { createOutput, Output } from './output';
import { Kafka } from 'kafkajs';
import { AvroProducerRecord } from '@ovotech/avro-kafkajs/dist/types';
import { Schema as JSONSchema, ensureValid } from '@ovotech/json-schema';
import { readFileSync } from 'fs';

const fileSchema: JSONSchema = {
  required: ['topic', 'schema', 'messages'],
  properties: {
    topic: { type: 'string' },
    schema: { type: 'object' },
    messages: {
      type: 'array',
      items: {
        required: ['value'],
        properties: {
          key: { type: 'string' },
          partition: { type: 'number' },
          value: { type: 'object' },
        },
      },
    },
    timeout: { type: 'number' },
    compression: { enum: [0, 1, 2, 3, 4] },
  },
};

const loadAvroProducerRecordFile = async (file: string): Promise<AvroProducerRecord> => {
  const record = JSON.parse(readFileSync(file, 'utf8'));
  return ensureValid<AvroProducerRecord>(fileSchema, record, { name: 'ProduceFile' });
};

interface Options {
  config?: string;
}

command
  .description('Consume a given topic')
  .option('-C, --config <configFile>', 'Config file with connection deails')
  .action(async (file, { config: configFile }: Options) => {
    const config = await loadConfigFile(configFile);

    const { messages, schema, topic } = await loadAvroProducerRecordFile(file);

    const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
    const kafka = new Kafka(config.kafka);
    const avroKafka = new AvroKafka(schemaRegistry, kafka);
    const output = createOutput(Output.CLI);

    output.log(
      `Produce "${messages.length}" messages for ${topic} in ${config.kafka.brokers.join(', ')}`,
    );
    const producer = avroKafka.producer();
    await producer.connect();

    try {
      await producer.send({ messages, schema, topic });
      output.success('Success');
    } finally {
      producer.disconnect();
    }
  })
  .parse(process.argv);
