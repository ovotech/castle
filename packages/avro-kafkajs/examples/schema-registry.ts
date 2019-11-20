import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';

const mySchema: Schema = {
  type: 'record',
  name: 'MyMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

// Typescript types for the schema
interface MyMessage {
  field1: string;
}

const main = async () => {
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });

  // Consuming
  const consumer = kafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic' });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = await schemaRegistry.decode<MyMessage>(message.value);
      console.log(value);
    },
  });

  // Producing
  const producer = kafka.producer();
  await producer.connect();

  const value = await schemaRegistry.encode<MyMessage>('my-topic', mySchema, {
    field1: 'my-string',
  });
  await producer.send({ topic: 'my-topic', messages: [{ value }] });
};

main();
