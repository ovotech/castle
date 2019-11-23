import { Command } from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka } from 'kafkajs';
import { table, devider, header, Output } from '../../output';
import { getPartitionProgress } from '../../helpers';

interface Options {
  config?: string;
  json?: boolean;
}
export const castleGroupShow = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle group show')
    .arguments('<groupId> <topic>')
    .description(
      `Show consumer group offsets for a topic.
Break it down by partition and calculate current lag (difference between current and latest offset)

Example:
  castle group-info my-group-id my-topic
  castle group-info my-group-id my-topic --json`,
    )
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (groupId, topic, { json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile(configFile);
        const kafka = new Kafka(config.kafka);

        const admin = kafka.admin();
        await admin.connect();
        try {
          output.log(header('Consumer group', groupId, config));

          const partitionsProgress = await getPartitionProgress(admin, topic, groupId);

          output.json(partitionsProgress);
          output.log(devider(`Offsets for topic ${topic} `));
          output.log(
            table([
              ['Partition', 'Offset', 'Group Offset', 'Lag', 'Metadata'],
              ...partitionsProgress.map(item => [
                String(item.partition),
                item.topicOffset,
                item.groupOffset,
                item.lag,
                item.metadata,
              ]),
            ]),
          );
        } finally {
          await admin.disconnect();
        }
      });
    });
