import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';

const myOldSchema: Schema = {
  type: 'record',
  name: 'MyOldMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

// Backwards compatible schema change
const myNewSchema: Schema = {
  type: 'record',
  name: 'MyNewMessage',
  fields: [
    { name: 'field1', type: 'string' },
    { name: 'field2', type: 'string', default: 'default-value' },
  ],
};

// Typescript types for the schema
interface MyOldMessage {
  field1: string;
}

interface MyNewMessage {
  field1: string;
  field2?: string;
}

const main = async () => {
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });
  const avroKafka = new AvroKafka(schemaRegistry, kafka);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic-evolution' });
  await consumer.run<MyOldMessage | MyNewMessage>({
    eachMessage: async ({ message }) => {
      if ('field2' in message.value) {
        // Typescript Type would match MyNewMessage
        console.log('new message', message.value.field2);
      } else {
        // Typescript Type would match MyOldMessage
        console.log('old message', message.value.field1);
      }
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();
  await producer.send<MyOldMessage>({
    topic: 'my-topic-evolution',
    schema: myOldSchema,
    messages: [{ value: { field1: 'my-string' } }],
  });
  await producer.send<MyNewMessage>({
    topic: 'my-topic-evolution',
    schema: myNewSchema,
    messages: [{ value: { field1: 'my-string', field2: 'new-string' } }],
  });
};

main();
