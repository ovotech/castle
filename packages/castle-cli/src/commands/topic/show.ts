import * as commander from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka, ResourceTypes } from 'kafkajs';
import { devider, table, header, Output } from '../../output';

interface Options {
  config?: string;
  json?: boolean;
  verbose?: 1 | 2 | 3 | 4;
}

export const castleTopicShow = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('show')
    .arguments('<topic>')
    .description(
      `Show partition, offsets and config entries of a topic.

Example:
  castle topic show my-topic
  castle topic show my-topic -vv
  castle topic show my-topic --json
`,
    )
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .option(
      '-v, --verbose',
      'Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level',
      (_, prev) => Math.min(prev + 1, 4),
      0,
    )
    .action(async (topic, { verbose, json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile({ file: configFile, verbose, output });
        const kafka = new Kafka(config.kafka);

        const admin = kafka.admin();
        await admin.connect();
        try {
          output.log(header('Topic', topic, config));

          const [offsets, resources] = await Promise.all([
            admin.fetchTopicOffsets(topic),
            admin.describeConfigs({
              resources: [{ type: ResourceTypes.TOPIC, name: topic }],
              includeSynonyms: false,
            }),
          ]);

          const configEntries =
            resources.resources.find((resource) => resource.resourceName === topic)
              ?.configEntries ?? [];

          output.json({ offsets, configEntries });

          output.log(devider('Partitions '));
          output.log(
            table([
              ['Partition', 'Offset', 'High', 'Low'],
              ...offsets.map((item) => [
                String(item.partition),
                String(item.offset),
                item.high,
                item.low,
              ]),
            ]),
          );
          output.log('');
          output.log(devider('Configuration '));
          output.log(
            table([
              ['Config Name', 'Value'],
              ...configEntries.map((entry) => [entry.configName, entry.configValue]),
            ]),
          );
        } finally {
          await admin.disconnect();
        }
      });
    });
