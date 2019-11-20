import * as command from 'commander';
import { loadConfigFile } from './config';
import { Kafka, ResourceTypes, DescribeConfigResponse } from 'kafkajs';
import { createOutput, Output, devider, highlight, table } from './output';

const getConfigValue = <T>(
  resouce: DescribeConfigResponse['resources'][0] | undefined,
  configName: string,
): string | undefined => {
  if (!resouce) {
    return undefined;
  }
  const configEntry = resouce
    ? resouce.configEntries.find(item => item.configName === configName)
    : undefined;
  return configEntry ? configEntry.configValue : undefined;
};

const formatMs = (ms: string | undefined): string =>
  ms ? (Number(ms) === Number.NaN ? ms : `${Number(ms) / (1000 * 60 * 60)} Hours`) : '-';

command
  .description('Get list of topics')
  .option('-J, --json', 'Output as json')
  .option('-C, --config <configFile>', 'Config file with connection deails')
  .action(async () => {
    const [name] = command.args;
    const { json, config: configFile } = command;
    const config = await loadConfigFile(configFile);
    const output = createOutput(json ? Output.JSON : Output.CLI);
    const kafka = new Kafka(config.kafka);

    const admin = kafka.admin();
    await admin.connect();
    try {
      if (name) {
        output.log(`Topics containing "${name}" in kafka ${config.kafka.brokers.join(', ')}`);
      } else {
        output.log(`All Topics in kafka ${config.kafka.brokers.join(', ')}`);
      }
      output.log(devider());

      const metadata = await admin.fetchTopicMetadata({ topics: [] });

      const topics = metadata.topics.filter(item => (name ? item.name.includes(name) : true));

      const resources = await admin.describeConfigs({
        resources: topics.map(topic => ({ type: ResourceTypes.TOPIC, name: topic.name })),
        includeSynonyms: false,
      });

      const data = topics.map(topic => {
        const resouce = resources.resources.find(item => item.resourceName === topic.name);

        return {
          name: topic.name,
          partitions: String(topic.partitions.length),
          retention: formatMs(getConfigValue(resouce, 'retention.ms')),
          cleanupPolicy: getConfigValue(resouce, 'cleanup.policy') || '-',
        };
      });

      if (topics.length === 0) {
        output.error('No topics found');
        output.json([]);
      } else {
        output.json(data);
        output.log(
          table([
            ['Topic', 'Partitions', 'Retention (Hours)', 'Cleanup Policy'],
            ...data.map(item => [
              highlight(item.name, name),
              item.partitions,
              item.retention,
              item.cleanupPolicy,
            ]),
          ]),
        );
      }
    } finally {
      await admin.disconnect();
    }
  })
  .parse(process.argv);
