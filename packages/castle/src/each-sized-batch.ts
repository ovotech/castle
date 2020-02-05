import { CastleConsumerConfig, CastleEachBatchPayload } from './types';
import chunk = require('lodash.chunk');

const DEFAULT_MAX_BATCH_SIZE = 500;

export const eachSizedBatch = <T extends any>(
  consumerConf: CastleConsumerConfig<T>,
): CastleConsumerConfig<T> => {
  const { maxBatchSize, eachSizedBatch, ...consumer } = consumerConf;
  const size = maxBatchSize || DEFAULT_MAX_BATCH_SIZE;
  return {
    ...consumer,
    eachBatch: async (payload: CastleEachBatchPayload<T>) => {
      const {
        batch: { messages },
        isRunning,
        isStale,
        commitOffsetsIfNecessary,
        heartbeat,
        resolveOffset,
      } = payload;

      for (const msgBatch of chunk(messages, size)) {
        /* avoid processing if the whole batch has been invalidated
         * (can happen with rebalances for example)
         */
        if (!isRunning() || isStale()) {
          break;
        }

        await eachSizedBatch!({
          ...payload,
          batch: {
            ...payload.batch,
            messages: msgBatch,
          },
        });

        /* Tell the broker we are still alive to avoid a rebalance if processing
         * the batch takes a long time
         */
        await heartbeat();
        const higherOffset = msgBatch
          .map(({ offset }: { offset: string }) => +offset)
          .sort((a: number, b: number) => a - b)
          .pop()!;
        /* Mark offset up to the last one as resolved
         */
        resolveOffset(higherOffset.toString());
        /* Commit offset of any resolved messages
         * if autoCommitThreshold or autoCommitInterval has been reached
         */
        await commitOffsetsIfNecessary();
      }
    },
  };
};
