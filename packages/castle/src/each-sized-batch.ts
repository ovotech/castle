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

  const chunks = chunk(messages, maxBatchSize);
  for (const msgBatch of chunks) {
    /* avoid processing if the whole batch has been invalidated
     * (can happen with rebalances for example)
     */
    if (!isRunning() || isStale()) {
      break;
    }

    const offsets = msgBatch.map(({ offset }) => +offset).sort((a, b) => a - b);

    const highestOffset = offsets[offsets.length - 1];
    const lowestOffset = offsets[0];

    await eachSizedBatch({
      ...payload,
      batch: {
        ...payload.batch,
        firstOffset() {
          return lowestOffset.toString();
        },
        lastOffset() {
          return highestOffset.toString();
        },
        messages: msgBatch,
      },
    });
    /* Tell the broker we are still alive to avoid a rebalance if processing
     * the batch takes a long time
     */
    await heartbeat();
    /* Mark offset up to the last one as resolved
     */
    resolveOffset(highestOffset.toString());
    /* Commit offset of any resolved messages
     * if autoCommitThreshold or autoCommitInterval has been reached
     */
    await commitOffsetsIfNecessary();
  }
};
