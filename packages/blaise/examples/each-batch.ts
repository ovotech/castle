import blaise from '@ovotech/blaise'

const schema: avsc.RecordType = {
  // [...]
};
const makeMessage = blaise({ avro: { schema })
blaise.eachBatch([makeMessage()]); // {batch: { topic: 'aTopic', value: {} }[...]}

