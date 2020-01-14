import { CastleConsumerConfig, CastleEachBatchPayload } from './types';
import chunk = require('lodash.chunk');

export default <T extends any>(consumerConf: CastleConsumerConfig<T>): CastleConsumerConfig<T> => {
  const { batchSize, eachBatch, ...consumer } = consumerConf;
  return {
    ...consumer,
    eachBatch: async (payload: CastleEachBatchPayload<T>) => {
      const {
        batch: { messages, partition },
        isRunning,
        isStale,
        commitOffsetsIfNecessary,
        heartbeat,
        resolveOffset,
      } = payload;

      for (const msgBatch of chunk(messages, batchSize)) {
        console.log('NICO', partition, batchSize, messages.length, msgBatch.length);
        /* avoid processing if the whole batch has been invalidated
         * (can happen with rebalances for example)
         */
        if (!isRunning() || isStale()) {
          console.log('URGH not running or stale');
          break;
        }

        await eachBatch!({
          ...payload,
          batch: {
            ...payload.batch,
            messages: msgBatch,
          },
        });
        console.log('DONE WITH THIS CHUNK');

        /* Tell the broker we are still alive to avoid a rebalance if processing
         * the batch takes a long time
         */
        await heartbeat();
        console.log('HEARTBEAT');
        const higherOffset = msgBatch
          .map(({ offset }: { offset: string }) => +offset)
          .sort((a: number, b: number) => a - b)
          .pop()!;
        /* Mark offset up to the last one as resolved
         */
        console.log('RESOLVE OFFSET');
        resolveOffset(higherOffset.toString());
        /* Commit offset of any resolved messages
         * if autoCommitThreshold or autoCommitInterval has been reached
         */
        console.log('COMMIT OFFSET');
        await commitOffsetsIfNecessary();
        console.log('COMMITED');
      }
    },
  };
};
