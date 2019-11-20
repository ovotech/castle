import * as command from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from './config';
import { createOutput, Output } from './output';
import { Kafka } from 'kafkajs';
import { readFileSync } from 'fs';

interface Options {
  config?: string;
  message: string;
  topic: string;
  key?: string;
  partition?: number;
  schema: string;
}

command
  .description('Consume a given topic')
  .option('-P, --partition <partition>', 'The partion to send this on', val => parseInt(val))
  .option('-K, --key <key>', 'Message key')
  .option('-M, --message <message>', 'The JSON message to be sent')
  .option('-S, --schema <schema>', 'Path to the schema file')
  .option('-S, --topic <topic>', 'Topic to produce messages in')
  .option('-C, --config <config>', 'Config file with connection deails')
  .action(
    async ({
      config: configFile,
      topic,
      message: messageJson,
      schema: schemaFile,
      key,
      partition,
    }: Options) => {
      const config = await loadConfigFile(configFile);
      const schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
      const messages = [{ value: JSON.parse(messageJson), key, partition }];

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
    },
  )
  .parse(process.argv);
