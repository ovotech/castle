import blaise from '@ovotech/blaise'

const schema: avsc.RecordType = {
  // [...]
};
blaise({ avro: { schema }).eachMessage(); // { topic: 'aTopic', value: {} [...]}

