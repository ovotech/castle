import { Command } from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from '../config';
import { header, Output } from '../output';
import { Kafka } from 'kafkajs';
import { readFileSync } from 'fs';

interface Options {
  config?: string;
  message: string;
  key?: string;
  partition?: number;
  schema: string;
}
export const produceMessageCommand = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle produce-message')
    .arguments('<topic>')
    .description(
      `Produce an ad-hoc message for a topic.
You need to specify schema file (with --schema) and message content as json (--message).

Example:
  castle produce-message my-topic --schema my-schema.json --message '{"text":"other"}'`,
    )
    .option('-P, --partition <partition>', 'the partion to send this on', val => parseInt(val))
    .option('-K, --key <key>', 'message key')
    .option('-M, --message <message>', 'the JSON message to be sent')
    .option('-S, --schema <schema>', 'path to the schema file')
    .option('-C, --config <config>', 'config file with connection deails')
    .action(
      async (
        topic,
        { config: configFile, message: messageJson, schema: schemaFile, key, partition }: Options,
      ) => {
        await output.wrap(false, async () => {
          const config = await loadConfigFile(configFile);
          const schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
          const messages = [{ value: JSON.parse(messageJson), key, partition }];

          const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
          const kafka = new Kafka(config.kafka);
          const avroKafka = new AvroKafka(schemaRegistry, kafka);

          output.log(header(`Produce message in`, topic, config));
          const producer = avroKafka.producer();
          await producer.connect();

          try {
            await producer.send({ messages, schema, topic });
            output.success('Success');
          } finally {
            producer.disconnect();
          }
        });
      },
    );
