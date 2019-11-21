import { Command } from 'commander';
import { loadConfigFile } from '../config';
import { Kafka, ResourceTypes, DescribeConfigResponse } from 'kafkajs';
import { highlight, table, header, Output } from '../output';

interface Options {
  config?: string;
  json?: boolean;
}

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

export const topicCommand = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle topic')
    .arguments('[name]')
    .description(
      `Get list of topics.

Example:
  castle topic
  castle topic my-to
  castle topic my-topic --json`,
    )
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (name, { json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile(configFile);
        const kafka = new Kafka(config.kafka);

        const admin = kafka.admin();
        await admin.connect();
        try {
          output.log(header('Topics containing', name ? name : '<all>', config));

          const metadata = await admin.fetchTopicMetadata({ topics: [] });

          const topics = metadata.topics.filter(item => (name ? item.name.includes(name) : true));

          const resources = topics.length
            ? await admin.describeConfigs({
                resources: topics.map(topic => ({ type: ResourceTypes.TOPIC, name: topic.name })),
                includeSynonyms: false,
              })
            : { resources: [] };

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
      });
    });
