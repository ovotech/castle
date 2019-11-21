import { Command } from 'commander';
import { loadConfigFile } from '../config';
import { Kafka, ResourceTypes } from 'kafkajs';
import { table, header, Output } from '../output';

interface ConfigEntry {
  name: string;
  value: string;
}

interface Options {
  config?: string;
  configEntry: ConfigEntry[];
}

export const topicUpdateCommand = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle topic-update')
    .arguments('<topic>')
    .description(
      `Update config entries of a topic.

Example:
  castle topic-update my-topic --config-entry file.delete.delay.ms=40000`,
    )
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
    .action(async (topic, { configEntry: configEntries, config: configFile }: Options) => {
      await output.wrap(false, async () => {
        const config = await loadConfigFile(configFile);
        const kafka = new Kafka(config.kafka);

        const admin = kafka.admin();
        await admin.connect();
        try {
          output.log(header('Updating topic', topic, config));
          output.log(
            table([
              ['Config', 'Update Value'],
              ...configEntries.map(item => [item.name, item.value]),
            ]),
          );
          await admin.alterConfigs({
            validateOnly: false,
            resources: [{ type: ResourceTypes.TOPIC, name: topic, configEntries }],
          });
          output.success('Complete');
        } finally {
          await admin.disconnect();
        }
      });
    });
