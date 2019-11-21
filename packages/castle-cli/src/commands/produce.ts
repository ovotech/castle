import { Command } from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from '../config';
import { Output } from '../output';
import { Kafka } from 'kafkajs';
import { AvroProducerRecord } from '@ovotech/avro-kafkajs/dist/types';
import { Schema as JSONSchema, ensureValid } from '@ovotech/json-schema';
import { readFileSync } from 'fs';

const fileSchema: JSONSchema = {
  type: 'object',
  required: ['topic', 'schema', 'messages'],
  properties: {
    topic: { type: 'string' },
    schema: { type: 'object' },
    messages: {
      type: 'array',
      items: {
        type: 'object',
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
export const produceCommand = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle produce')
    .arguments('<file>')
    .description(
      `Produce messages for a topic.
Using a file that contains schema, topic and messages to be produced.

Example:
  castle produce my-produce-file.json

Example produce file:
{
  "topic": "my-topic",
  "schema": {
    "name": "Event",
    "type": "record",
    "fields": [{"name": "field1","type": "string"}]
  },
  "messages": [{"partition": 0, "value": { "field1": "test1" }}]
}`,
    )
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (file, { config: configFile }: Options) => {
      await output.wrap(false, async () => {
        const config = await loadConfigFile(configFile);

        const { messages, schema, topic } = await loadAvroProducerRecordFile(file);

        const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
        const kafka = new Kafka(config.kafka);
        const avroKafka = new AvroKafka(schemaRegistry, kafka);

        output.log(
          `Produce "${messages.length}" messages for ${topic} in ${config.kafka.brokers.join(
            ', ',
          )}`,
        );
        const producer = avroKafka.producer();
        await producer.connect();

        try {
          await producer.send({ messages, schema, topic });
          output.success('Success');
        } finally {
          producer.disconnect();
        }
      });
    });
