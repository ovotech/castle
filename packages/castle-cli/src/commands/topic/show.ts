import { Command } from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka, ResourceTypes } from 'kafkajs';
import { devider, table, header, Output } from '../../output';

interface Options {
  config?: string;
  json?: boolean;
}

export const castleTopicShow = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle topic show')
    .arguments('<topic>')
    .description(
      `Show partition, offsets and config entries of a topic.

Example:
  castle topic show my-topic
  castle topic show my-topic --json`,
    )
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (topic, { json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile(configFile);
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

          const resource = resources.resources.find(resource => resource.resourceName === topic);
          const configEntries = resource ? resource.configEntries : [];

          output.json({ offsets, configEntries });

          output.log(devider('Partitions '));
          output.log(
            table([
              ['Partition', 'Offset', 'High', 'Low'],
              ...offsets.map(item => [
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
              ...configEntries.map(entry => [entry.configName, entry.configValue]),
            ]),
          );
        } finally {
          await admin.disconnect();
        }
      });
    });
