import * as command from 'commander';
import { loadConfigFile } from './config';
import { Kafka } from 'kafkajs';
import { createOutput, Output, devider, table } from './output';

interface ConfigEntry {
  name: string;
  value: string;
}

interface Options {
  config?: string;
  numPartitions: number;
  replicationFactor: number;
  configEntry: ConfigEntry[];
}

command
  .description('Get info for a topic')
  .option('-P, --num-partitions <partitions>', 'Number of partitions', val => parseInt(val), 1)
  .option('-R, --replication-factor <factor>', 'Replication Factor', val => parseInt(val), 1)
  .option(
    '-E, --config-entry <entry>',
    'Set a config entry, title=value, can use multiple times',
    (entry: string, configEntries: ConfigEntry[]) => {
      const [name, value] = entry.split('=').map(item => item.trim());
      return configEntries.concat([{ name, value }]);
    },
    [],
  )
  .option('-C, --config <config>', 'Config file with connection deails')
  .action(
    async (
      topic,
      { numPartitions, replicationFactor, configEntry: configEntries, config: configFile }: Options,
    ) => {
      const config = await loadConfigFile(configFile);
      const kafka = new Kafka(config.kafka);
      const output = createOutput(Output.CLI);

      const admin = kafka.admin();
      await admin.connect();
      try {
        output.log(`Creating "${topic}" in kafka ${config.kafka.brokers.join(', ')}`);
        output.log(devider());
        output.log(
          table([
            ['Title', 'Value'],
            ['Number of partitions', String(numPartitions)],
            ['Replication factor', String(replicationFactor)],
            ...configEntries.map(item => [item.name, item.value]),
          ]),
        );

        await admin.createTopics({
          topics: [{ topic, numPartitions, replicationFactor, configEntries }],
        });
        output.success('Complete');
      } finally {
        await admin.disconnect();
      }
    },
  )
  .parse(process.argv);
