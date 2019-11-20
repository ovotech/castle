import * as command from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { inspect } from 'util';
import { loadConfigFile } from './config';
import { createOutput, Output, devider } from './output';
import { Kafka } from 'kafkajs';
import * as uuid from 'uuid';
import * as Long from 'long';
import { AvroKafkaMessage, AvroBatch, AvroProducerRecord } from '@ovotech/avro-kafkajs/dist/types';

const toMessageOutput = (
  { partition }: AvroBatch,
  { key, offset, value }: AvroKafkaMessage,
  depth: number,
): string => {
  return (
    devider(`Partition ${partition} - Key ${key} - Offset ${offset} `) +
    '\n' +
    inspect(value, { depth, colors: true })
  );
};

interface Options {
  configFile?: string;
  groupId?: string;
  depth: number;
  tail: boolean;
  json: boolean;
}

command
  .description('Consume a given topic')
  .option('-D, --depth <depth>', 'Depth for the schemas output', val => parseInt(val), 5)
  .option('-G, --group-id', 'Consumer group id, defaults to random uuid')
  .option('-T, --tail', 'Start listening for new events')
  .option('-J, --json', 'Output as json')
  .option('-C, --config <configFile>', 'Config file with connection deails')
  .action(async (topic, { groupId, depth, json, tail, configFile }: Options) => {
    const config = await loadConfigFile(configFile);
    const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
    const kafka = new Kafka(config.kafka);
    const avroKafka = new AvroKafka(schemaRegistry, kafka);
    const output = createOutput(json ? Output.JSON : Output.CLI);

    output.log(`Consuming "${topic}" from ${config.kafka.brokers.join(', ')}`);
    const consumer = avroKafka.consumer({ groupId: groupId || `castle-cli-${uuid.v4()}` });
    const admin = kafka.admin();
    await Promise.all([consumer.connect(), admin.connect()]);

    try {
      let jsonResult: AvroProducerRecord;

      await consumer.subscribe({ topic, fromBeginning: !tail });
      const offsets = await admin.fetchTopicOffsets(topic);
      await admin.disconnect();

      const partitionsProgress: { [key: number]: boolean } = offsets.reduce(
        (acc, offset) => ({ ...acc, [offset.partition]: false }),
        {},
      );

      await consumer.run({
        eachBatch: async ({ batch }) => {
          const offsetLagLow = Long.fromString(batch.offsetLagLow());
          const nonZeroOffsetLagLow = offsetLagLow.isZero() ? Long.fromValue(1) : offsetLagLow;
          const offsetLag = Long.fromString(batch.offsetLag());

          const progress = nonZeroOffsetLagLow
            .subtract(offsetLag)
            .divide(nonZeroOffsetLagLow)
            .toInt();
          const progressPercent = Math.round(progress * 100);

          const range = `${batch.firstOffset()}...${batch.lastOffset()}`;
          output.log(
            devider(`Partition ${batch.partition} - Offsets ${range} (${progressPercent}%) `, '#'),
          );
          output.log(
            batch.messages.map(message => toMessageOutput(batch, message, depth)).join('\n'),
          );

          jsonResult = {
            topic,
            schema: batch.messages[0].schema,
            messages: (jsonResult ? jsonResult.messages : []).concat(
              batch.messages.map(message => ({
                partition: batch.partition,
                value: message.value,
                key: message.key,
              })),
            ),
          };

          partitionsProgress[batch.partition] = Long.fromString(batch.offsetLag()).isZero();

          if (!tail && Object.values(partitionsProgress).every(finished => finished)) {
            output.json(jsonResult);
            await consumer.disconnect();
          }
        },
      });
    } catch (error) {
      output.error(error);
      consumer.disconnect();
    }
  })
  .parse(process.argv);
