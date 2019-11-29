import { Command } from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from '../../config';
import { Output } from '../../output';
import { Kafka } from 'kafkajs';
import { AvroProducerRecord } from '@ovotech/avro-kafkajs/dist/types';
import {
  Record,
  String,
  Unknown,
  Array,
  Number,
  Literal,
  Union,
  Dictionary,
  Partial,
} from 'runtypes';
import { readFileSync } from 'fs';
import { Type, Schema } from 'avsc';

const TypeBuffer = Unknown.withGuard(Buffer.isBuffer);
const TypeSchema = Unknown.withConstraint<Schema>((item: any) => {
  try {
    Type.forSchema(item);
    return true;
  } catch (error) {
    return `Invalid Schema: ${error}`;
  }
});

const ProduceFileType = Record({
  topic: String,
  schema: TypeSchema,
  messages: Array(
    Record({ value: Unknown }).And(
      Partial({
        key: String,
        partition: Number,
        headers: Dictionary(TypeBuffer),
        timestamp: String,
      }),
    ),
  ),
}).And(
  Partial({
    timeout: Number,
    compression: Union(Literal(0), Literal(1), Literal(2), Literal(3), Literal(4)),
  }),
);

const loadAvroProducerRecordFile = (file: string): AvroProducerRecord => {
  const result = ProduceFileType.validate(JSON.parse(readFileSync(file, 'utf8')));
  if (result.success !== true) {
    throw new Error(`Invalid produce file. ${result.key}: ${result.message}`);
  }
  return result.value;
};

interface Options {
  config?: string;
}
export const castleTopicProduce = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle topic produce')
    .arguments('<file>')
    .description(
      `Produce messages for a topic.
Using a file that contains schema, topic and messages to be produced.

Example:
  castle topic produce my-produce-file.json

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
