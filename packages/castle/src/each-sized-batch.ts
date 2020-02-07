import { CastleEachBatchPayload } from './types';
import chunk = require('lodash.chunk');

export const withEachSizedBatch = <T extends unknown>(
  eachSizedBatch: (ctx: CastleEachBatchPayload<T>) => Promise<void>,
  maxBatchSize: number,
): ((ctx: CastleEachBatchPayload<T>) => Promise<void>) => async (
  payload: CastleEachBatchPayload<T>,
) => {
  const {
    batch: { messages },
    isRunning,
    isStale,
    commitOffsetsIfNecessary,
    heartbeat,
    resolveOffset,
  } = payload;

  for (const msgBatch of chunk(messages, maxBatchSize)) {
    /* avoid processing if the whole batch has been invalidated
     * (can happen with rebalances for example)
     */
    if (!isRunning() || isStale()) {
      break;
    }
    await eachSizedBatch({
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
      .map(({ offset }) => +offset)
      .sort((a, b) => a - b)
      .pop() as number;
    /* Mark offset up to the last one as resolved
     */
    resolveOffset(higherOffset.toString());
    /* Commit offset of any resolved messages
     * if autoCommitThreshold or autoCommitInterval has been reached
     */
    await commitOffsetsIfNecessary();
  }
};
