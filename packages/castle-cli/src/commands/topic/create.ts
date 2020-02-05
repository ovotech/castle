import { Command } from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka } from 'kafkajs';
import { table, header, Output } from '../../output';

interface ConfigEntry {
  name: string;
  value: string;
}

interface Options {
  config?: string;
  numPartitions?: number;
  replicationFactor?: number;
  configEntry?: ConfigEntry[];
  verbose?: 1 | 2 | 3 | 4;
}

export const castleTopicCreate = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle topic create')
    .arguments('<topic>')
    .description(
      `Create a topic. Can specify number of partitions, replaction factors and config entries.

Example:
  castle topic create my-topic
  castle topic create my-topic -vvvv
  castle topic create my-topic --num-partitions 2 --replication-factor 2 --config-entry file.delete.delay.ms=40000`,
    )
    .option('-P, --num-partitions <partitions>', 'number of partitions', val => parseInt(val), 1)
    .option('-R, --replication-factor <factor>', 'replication Factor', val => parseInt(val), 1)
    .option(
      '-E, --config-entry <entry>',
      'set a config entry, title=value, can use multiple times',
      (entry: string, configEntries: ConfigEntry[]) => {
        const [name, value] = entry.split('=').map(item => item.trim());
        return configEntries.concat([{ name, value }]);
      },
      [],
    )
    .option('-C, --config <config>', 'config file with connection deails')
    .option(
      '-v, --verbose',
      'Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level',
      (_, prev) => Math.min(prev + 1, 4),
      0,
    )
    .action(
      async (
        topic,
        {
          verbose,
          numPartitions,
          replicationFactor,
          configEntry: configEntries,
          config: configFile,
        }: Options,
      ) => {
        await output.wrap(false, async () => {
          const config = await loadConfigFile({ file: configFile, verbose, output });
          const kafka = new Kafka(config.kafka);

          const admin = kafka.admin();
          await admin.connect();
          try {
            output.log(header('Creating topic', topic, config));
            output.log(
              table([
                ['Title', 'Value'],
                ['Number of partitions', String(numPartitions)],
                ['Replication factor', String(replicationFactor)],
                ...(configEntries ? configEntries.map(item => [item.name, item.value]) : []),
              ]),
            );

            await admin.createTopics({
              topics: [{ topic, numPartitions, replicationFactor, configEntries }],
            });
            output.success('Complete');
          } finally {
            await admin.disconnect();
          }
        });
      },
    );
