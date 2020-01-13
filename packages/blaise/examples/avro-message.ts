import blaise from '@ovotech/blaise'

const schema: avsc.RecordType = {
  type: 'record',
  name: '',
  fields: [{ name: 'anInt', type: 'int' }],
};
type MyType = { anInt: number };
blaise<MyType>({ avro: { schema } }).message(); // {topic: '', {anInt: 32}, [...]}

