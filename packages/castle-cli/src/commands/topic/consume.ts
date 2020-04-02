import * as commander from 'commander';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { inspect } from 'util';
import { loadConfigFile } from '../../config';
import { devider, table, header, Output } from '../../output';
import { Kafka } from 'kafkajs';
import * as uuid from 'uuid';
import * as Long from 'long';
import { AvroKafkaMessage, AvroBatch, AvroProducerRecord } from '@ovotech/avro-kafkajs/dist/types';
import { getPartitionProgress, isPartitionProgressFinished } from '../../helpers';

const toMessageOutput = (
  { partition }: AvroBatch,
  { key, offset, value }: AvroKafkaMessage,
  { depth, encodedKey }: { encodedKey: boolean; depth: number },
): string => {
  return encodedKey
    ? devider(`Partition ${partition} - Offset ${offset} `) +
        '\n' +
        inspect(key, { depth, colors: true }) +
        '\n' +
        inspect(value, { depth, colors: true })
    : devider(`Partition ${partition} - Key ${key} - Offset ${offset} `) +
        '\n' +
        inspect(value, { depth, colors: true });
};

interface Options {
  config?: string;
  groupId: string;
  depth: number;
  tail?: boolean;
  encodedKey: boolean;
  json: boolean;
  verbose?: 1 | 2 | 3 | 4;
}

export const castleTopicConsume = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('consume')
    .description(
      `Consume messages of a topic. Use schema registry to decode avro messages.
By default would use a new random consumer group id to retrieve all the messages and exit.

Using the --json option you will output the result as json, that can be then be used by "castle produce" command

Example:
  castle topic consume my-topic
  castle topic consume my-topic -vvvv
  castle topic consume my-topic --tail
  castle topic consume my-topic --group-id my-group-id
  castle topic consume my-topic --json
`,
    )
    .arguments('<topic>')
    .option('-D, --depth <depth>', 'depth for the schemas output', (val) => parseInt(val), 5)
    .option(
      '-G, --group-id <groupId>',
      'consumer group id, defaults to random uuid',
      /[a-zA-Z].*/,
      `castle-cli-${uuid.v4()}`,
    )
    .option('-T, --tail', 'start listening for new events')
    .option('-K, --encoded-key', 'Decode the key with avro schema too', false)
    .option('-J, --json', 'output as json')
    .option(
      '-v, --verbose',
      'Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level',
      (_, prev) => Math.min(prev + 1, 4),
      0,
    )
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(
      async (
        topic,
        { verbose, encodedKey, groupId, depth, json, tail, config: configFile }: Options,
      ) => {
        await output.wrap(json, async () => {
          const config = await loadConfigFile({ file: configFile, verbose, output });
          const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
          const kafka = new Kafka({
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
                ...partitionsProgress.map((item) => [
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
              await new Promise(async (resolve) => {
                await consumer.run({
                  encodedKey,
                  eachBatch: async (payload) => {
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
                      batch.messages
                        .map((message) => toMessageOutput(batch, message, { depth, encodedKey }))
                        .join('\n'),
                    );

                    jsonResult = {
                      topic,
                      schema: batch.messages[0].schema,
                      messages: (jsonResult ? jsonResult.messages : []).concat(
                        batch.messages.map((message) => ({
                          partition: batch.partition,
                          value: message.value,
                          key: message.key,
                        })),
                      ),
                    };
                    partitionsProgress[
                      partitionsProgress.findIndex((item) => item.partition === batch.partition)
                    ].isFinished = Long.fromString(batch.offsetLag()).isZero();

                    if (!tail && isPartitionProgressFinished(partitionsProgress)) {
                      output.json(jsonResult);
                      output.success('Success');
                      consumer.pause([{ topic }]);
                      setTimeout(async () => {
                        await consumer.disconnect();
                        resolve();
                      }, 10);
                    }
                  },
                });
              });
            }
          } catch (error) {
            await consumer.disconnect();
            throw error;
          }
        });
      },
    );
