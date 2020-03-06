import { Command } from 'commander';
import { loadConfigFile } from '../../config';
import { Kafka, SeekEntry } from 'kafkajs';
import { table, header, Output } from '../../output';

interface Options {
  config?: string;
  json?: boolean;
  resetOffsets?: 'earliest' | 'latest';
  setOffset?: SeekEntry[];
  verbose?: 1 | 2 | 3 | 4;
}
export const castleGroupUpdate = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle group update')
    .arguments('<groupId> <topic>')
    .description(
      `Update consumer group offsets for a topic.
Requires either --reset-offsets or --set-offset options.

Example:
  castle group update my-group-id my-topic --reset-offsets earliest
  castle group update my-group-id my-topic --reset-offsets earliest -vv
  castle group update my-group-id my-topic --set-offset 0=10 --set-offset 1=10`,
    )
    .option(
      '-R, --reset-offsets <earliest|latest>',
      'reset consumer group offset',
      /(earliest|latest)/,
    )
    .option(
      '-E, --set-offset <entry>',
      'set an offset, partition=offset, can use multiple times',
      (entry: string, partitions: SeekEntry[]) => {
        const [partition, offset] = entry.split('=').map(item => item.trim());
        return partitions.concat([{ partition: Number(partition), offset }]);
      },
      [],
    )
    .option('-C, --config <configFile>', 'config file with connection deails')
    .option(
      '-v, --verbose',
      'Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level',
      (_, prev) => Math.min(prev + 1, 4),
      0,
    )
    .action(
      async (groupId, topic, { verbose, resetOffsets, setOffset, config: configFile }: Options) => {
        await output.wrap(false, async () => {
          const config = await loadConfigFile({ file: configFile, verbose, output });
          const kafka = new Kafka(config.kafka);

          const admin = kafka.admin();
          await admin.connect();
          try {
            output.log(header('Consumer group', groupId, config));

            if (resetOffsets) {
              await admin.resetOffsets({ groupId, topic, earliest: resetOffsets === 'earliest' });
              output.success(`Success. Topic ${topic} offsets reset to ${resetOffsets}`);
            } else if (setOffset) {
              await admin.setOffsets({ groupId, topic, partitions: setOffset });
              output.success(`Success. Topic ${topic} offsets set`);
              output.success(
                table([
                  ['Partition', 'Offset'],
                  ...setOffset.map(item => [String(item.partition), item.offset]),
                ]),
              );
            } else {
              output.error(
                'No command give, you need to either reset (--reset-offsets) or set offsets (--set-offset)',
              );
            }
          } finally {
            await admin.disconnect();
          }
        });
      },
    );
