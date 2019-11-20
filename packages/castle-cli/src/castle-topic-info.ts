import * as command from 'commander';
import { loadConfigFile } from './config';
import { Kafka, ResourceTypes } from 'kafkajs';
import { createOutput, Output, devider, table } from './output';

interface Options {
  config?: string;
  json?: boolean;
}

command
  .description('Get info for a topic')
  .option('-J, --json', 'Output as json')
  .option('-C, --config <configFile>', 'Config file with connection deails')
  .action(async (topic, { json, config: configFile }: Options) => {
    const config = await loadConfigFile(configFile);
    const kafka = new Kafka(config.kafka);
    const output = createOutput(json ? Output.JSON : Output.CLI);

    const admin = kafka.admin();
    await admin.connect();
    try {
      output.log(`Fetching data for "${topic}" in kafka ${config.kafka.brokers.join(', ')}`);
      output.log('');
      output.log(devider('Partitions '));

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
  })
  .parse(process.argv);
