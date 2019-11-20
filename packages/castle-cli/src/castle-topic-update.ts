import * as command from 'commander';
import { loadConfigFile } from './config';
import { Kafka, ResourceTypes } from 'kafkajs';
import { createOutput, Output, table } from './output';

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
  .description('Update an existing topic')
  .option('-P, --num-partitions <partitions>', 'Number of partitions', val => parseInt(val))
  .option('-R, --replication-factor <factor>', 'Replication Factor', val => parseInt(val))
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
  .action(async (name, { configEntry: configEntries, config: configFile }: Options) => {
    const config = await loadConfigFile(configFile);
    const kafka = new Kafka(config.kafka);
    const output = createOutput(Output.CLI);

    const admin = kafka.admin();
    await admin.connect();
    try {
      output.log(`Updating "${name}" in kafka ${config.kafka.brokers.join(', ')}`);
      output.log(
        table([['Config', 'Update Value'], ...configEntries.map(item => [item.name, item.value])]),
      );
      await admin.alterConfigs({
        validateOnly: false,
        resources: [{ type: ResourceTypes.TOPIC, name, configEntries }],
      });
      output.success('Complete');
    } finally {
      await admin.disconnect();
    }
  })
  .parse(process.argv);
