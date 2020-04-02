import * as commander from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka, ResourceTypes, DescribeConfigResponse } from 'kafkajs';
import { highlight, table, header, Output } from '../../output';

interface Options {
  config?: string;
  json?: boolean;
  verbose?: 1 | 2 | 3 | 4;
}

const getConfigValue = <T>(
  resouce: DescribeConfigResponse['resources'][0] | undefined,
  configName: string,
): string | undefined =>
  resouce?.configEntries.find((item) => item.configName === configName)?.configValue;

const formatMs = (ms: string | undefined): string =>
  ms ? (Number(ms) === Number.NaN ? ms : `${Number(ms) / (1000 * 60 * 60)} Hours`) : '-';

export const castleTopicSearch = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('search')
    .arguments('[name]')
    .description(
      `Get list of topics. If you don't specify a search string returns all of them.

Example:
  castle topic search
  castle topic search my-to
  castle topic search my-to -vv
  castle topic search my-topic --json
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
    .action(async (name, { verbose, json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile({ file: configFile, verbose, output });
        const kafka = new Kafka(config.kafka);

        const admin = kafka.admin();
        await admin.connect();
        try {
          output.log(header('Topics containing', name ? name : '<all>', config));

          const metadata = await admin.fetchTopicMetadata({ topics: [] });

          const topics = metadata.topics.filter((item) => (name ? item.name.includes(name) : true));

          const resources = topics.length
            ? await admin.describeConfigs({
                resources: topics.map((topic) => ({ type: ResourceTypes.TOPIC, name: topic.name })),
                includeSynonyms: false,
              })
            : { resources: [] };

          const data = topics.map((topic) => {
            const resouce = resources.resources.find((item) => item.resourceName === topic.name);

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
                ...data.map((item) => [
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
