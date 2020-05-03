import { AvroTransformBatch } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';
import { ObjectReadableMock } from 'stream-mock';

const mySchema: Schema = {
  type: 'record',
  name: 'MyMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

// Typescript types for the schema
interface MyMessage {
  field1: string;
}

const data = new ObjectReadableMock(['one', 'two', 'three']);

const main = async () => {
  const transform = new AvroTransformBatch<string, MyMessage, null>({
    topic: 'test',
    toKafkaMessage: (message) => ({
      value: { field1: message },
      key: null,
      schema: mySchema,
    }),
  });

  data.pipe(transform).on('data', (payload) => console.log(payload.batch.messages));
};

main();
