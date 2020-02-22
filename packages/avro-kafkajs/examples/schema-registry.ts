import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';

const mySchema: Schema = {
  type: 'record',
  name: 'MyMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

const myKeySchema: Schema = {
  type: 'record',
  name: 'MyKey',
  fields: [{ name: 'id', type: 'int' }],
};

// Typescript types for the schema
interface MyMessage {
  field1: string;
}

// Typescript types for the key schema
interface MyKey {
  id: number;
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
      const key = await schemaRegistry.decode<MyMessage>(message.key);
      console.log(value, key);
    },
  });

  // Producing
  const producer = kafka.producer();
  await producer.connect();

  // Encode the value
  const value = await schemaRegistry.encode<MyMessage>('my-topic', 'value', mySchema, {
    field1: 'my-string',
  });

  // Optionally encode the key
  const key = await schemaRegistry.encode<MyKey>('my-topic', 'key', myKeySchema, {
    id: 10,
  });
  await producer.send({ topic: 'my-topic', messages: [{ value, key }] });
};

main();
