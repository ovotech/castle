import { Command } from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { inspect } from 'util';
import { loadConfigFile } from '../../config';
import { devider, table, header, Output } from '../../output';
import { Kafka, logLevel } from 'kafkajs';
import * as uuid from 'uuid';
import * as Long from 'long';
import { AvroKafkaMessage, AvroBatch, AvroProducerRecord } from '@ovotech/avro-kafkajs/dist/types';
import { getPartitionProgress, isPartitionProgressFinished } from '../../helpers';

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
  config?: string;
  groupId: string;
  depth: number;
  tail?: boolean;
  json: boolean;
}
export const castleTopicConsume = (command: Command, output = new Output(console)): Command =>
  command
    .description(
      `Consume messages of a topic. Use schema registry to decode avro messages.
By default would use a new random consumer group id to retrieve all the messages and exit.

Using the --json option you will output the result as json, that can be then be used by "castle produce" command

Example:
  castle topic consume my-topic
  castle topic consume my-topic --tail
  castle topic consume my-topic --group-id my-group-id
  castle topic consume my-topic --json`,
    )
    .name('castle topic consume')
    .arguments('<topic>')
    .option('-D, --depth <depth>', 'depth for the schemas output', val => parseInt(val), 5)
    .option(
      '-G, --group-id <groupId>',
      'consumer group id, defaults to random uuid',
      /[a-zA-Z].*/,
      `castle-cli-${uuid.v4()}`,
    )
    .option('-T, --tail', 'start listening for new events')
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (topic, { groupId, depth, json, tail, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile(configFile);
        const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
        const kafka = new Kafka({
          logLevel: logLevel.ERROR,
          clientId: 'castle-cli',
          ...config.kafka,
        });
        const avroKafka = new AvroKafka(schemaRegistry, kafka);

        output.log(header('Consume', topic, config));

        const consumer = avroKafka.consumer({ groupId });
        const admin = kafka.admin();
        await Promise.all([consumer.connect(), admin.connect()]);

        try {
          let jsonResult: AvroProducerRecord;

          await consumer.subscribe({ topic, fromBeginning: !tail });
          const partitionsProgress = await getPartitionProgress(admin, topic, groupId);
          await admin.disconnect();

          output.log(devider(`Offsets for groupId ${groupId} `));
          output.log(
            table([
              ['Partition', 'Offset', 'Group Offset', 'Lag'],
              ...partitionsProgress.map(item => [
                String(item.partition),
                item.topicOffset,
                item.groupOffset,
                item.lag,
              ]),
            ]),
          );

          if (isPartitionProgressFinished(partitionsProgress)) {
            output.error('No more messages for this consumer group');
            output.json([]);
            await consumer.disconnect();
          } else {
            await consumer.run({
              eachBatch: async payload => {
                const batch = payload.batch;
                const offsetLagLow = Long.fromString(batch.offsetLagLow());
                const nonZeroOffsetLagLow = offsetLagLow.isZero()
                  ? Long.fromValue(1)
                  : offsetLagLow;
                const offsetLag = Long.fromString(batch.offsetLag());

                const progress = nonZeroOffsetLagLow
                  .subtract(offsetLag)
                  .divide(nonZeroOffsetLagLow)
                  .toInt();
                const progressPercent = Math.round(progress * 100);

                const range = `${batch.firstOffset()}...${batch.lastOffset()}`;
                output.log('');
                output.log(
                  devider(
                    `Partition ${batch.partition} - Offsets ${range} (${progressPercent}%) `,
                    '#',
                  ),
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

                partitionsProgress[
                  partitionsProgress.findIndex(item => item.partition === batch.partition)
                ].isFinished = Long.fromString(batch.offsetLag()).isZero();

                if (!tail && isPartitionProgressFinished(partitionsProgress)) {
                  output.json(jsonResult);
                  output.success('Success');
                  consumer.pause([{ topic }]);
                  setTimeout(() => consumer.disconnect(), 0);
                }
              },
            });
          }
        } catch (error) {
          consumer.disconnect();
          throw error;
        }
      });
    });
