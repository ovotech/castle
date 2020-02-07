import { TopicsAlias } from '@ovotech/avro-kafkajs';
import { CastleConsumer, Castle } from './types';
import { isString } from 'util';

export const table = (rows: string[][]): string => {
  const columns = rows[0].map((_, index) => rows.map(row => row[index]));
  const columnLengths = columns.map(column =>
    column.reduce((len, item) => Math.max(len, item.length), 0),
  );

  return rows
    .map(row =>
      row.map((item, index) => item + ' '.repeat(columnLengths[index] - item.length)).join(' | '),
    )
    .join('\n');
};

export const describeTopicAliases = (topicAlias: TopicsAlias): string | undefined => {
  const maps = Object.entries(topicAlias);
  return maps.length ? `Topic Aliases:\n${table(maps)}\n` : undefined;
};

export const describeCastleConsumers = (castleConfigs: CastleConsumer[]): string | undefined => {
  const titles = ['Topic', 'Original Topic', 'Type', 'Group', 'Concurrency', 'From Beginning'];
  const descriptions = castleConfigs.map(({ config, instance }) => {
    const { topic, partitionsConsumedConcurrently, groupId, fromBeginning } = config;
    const message = 'eachBatch' in config ? 'Batch' : 'Message';

    return [
      String(topic),
      typeof topic === 'string' && instance.topicsAlias[topic] ? instance.topicsAlias[topic] : '-',
      message,
      groupId,
      partitionsConsumedConcurrently === undefined ? '-' : String(partitionsConsumedConcurrently),
      fromBeginning ? 'Yes' : '-',
    ];
  });
  return castleConfigs.length ? `Consumers:\n${table([titles, ...descriptions])}` : undefined;
};

export const describeCastle = (castle: Castle): string => {
  const descriptionRows = [
    describeTopicAliases(castle.kafka.topicsAlias),
    describeCastleConsumers(castle.consumers),
  ]
    .filter(isString)
    .join('\n');
  return ` 🏰 Castle: ${castle.isRunning() ? 'Running' : 'Stopped'}\n\n${descriptionRows}\n`;
};
