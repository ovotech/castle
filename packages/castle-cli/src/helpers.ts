import { Admin } from 'kafkajs';
import Long = require('long');

export interface PartitionProgress {
  partition: number;
  topicOffset: string;
  groupOffset: string;
  metadata: string;
  lag: string;
  isFinished: boolean;
}

export const getPartitionProgress = async (
  admin: Admin,
  topic: string,
  groupId: string,
): Promise<PartitionProgress[]> => {
  const offsets = await admin.fetchTopicOffsets(topic);
  const groupOffsets = await admin.fetchOffsets({ groupId, topic });

  console.log(groupOffsets);

  return offsets.map(offset => {
    const groupOffset = groupOffsets.find(item => item.partition === offset.partition);
    return {
      partition: offset.partition,
      groupOffset: groupOffset ? groupOffset.offset : '',
      topicOffset: offset.offset,
      isFinished: groupOffset ? groupOffset.offset === offset.offset : false,
      lag: groupOffset
        ? Long.fromString(offset.offset)
            .subtract(Long.fromString(groupOffset.offset))
            .toString()
        : '',
      metadata: groupOffset && groupOffset.metadata ? groupOffset.metadata : '',
    };
  });
};

export const isPartitionProgressFinished = (partitionProgress: PartitionProgress[]): boolean =>
  partitionProgress.every(item => item.isFinished);
