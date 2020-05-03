import { Schema } from 'avsc';
import { ObjectReadableMock } from 'stream-mock';
import { createCastleStream, StreamKafkaMessage } from '@ovotech/castle-stream';

export interface Event1 {
  field1: string;
}

export const Event1Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

const main = async () => {
  const castleStream = createCastleStream({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: 'test1',
        source: new ObjectReadableMock(['test1', 'test2', 'test3']),
        eachMessage: async (message) => {
          console.log(message);
        },
        toKafkaMessage: (message: string): StreamKafkaMessage<Event1> => ({
          key: Buffer.from(''),
          value: { field1: message },
          schema: Event1Schema,
        }),
      },
    ],
  });

  await castleStream.start();
};

main();
