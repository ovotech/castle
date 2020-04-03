import * as commander from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka, ResourceTypes } from 'kafkajs';
import { table, header, Output } from '../../output';

interface ConfigEntry {
  name: string;
  value: string;
}

interface Options {
  config?: string;
  configEntry: ConfigEntry[];
  verbose?: 1 | 2 | 3 | 4;
}

export const castleTopicUpdate = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('update')
    .arguments('<topic>')
    .description(
      `Update config entries of a topic.
All the available topic configurations can be found in the confluent documentation https://docs.confluent.io/current/installation/configuration/topic-configs.html

Example:
  castle topic update my-topic --config-entry file.delete.delay.ms=40000
  castle topic update my-topic --config-entry file.delete.delay.ms=40000 -vv
`,
    )
    .requiredOption(
      '-E, --config-entry <entry>',
      'set a config entry, title=value, can use multiple times',
      (entry: string, configEntries: ConfigEntry[]) => {
        const [name, value] = entry.split('=').map((item) => item.trim());
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
    .action(async (topic, { verbose, configEntry: configEntries, config: configFile }: Options) => {
      await output.wrap(false, async () => {
        const config = await loadConfigFile({ file: configFile, verbose, output });
        const kafka = new Kafka(config.kafka);

        const admin = kafka.admin();
        await admin.connect();
        try {
          output.log(header('Updating topic', topic, config));
          output.log(
            table([
              ['Config', 'Update Value'],
              ...configEntries.map((item) => [item.name, item.value]),
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
