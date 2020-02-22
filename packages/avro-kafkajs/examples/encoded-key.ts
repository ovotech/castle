import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';

const myValueSchema: Schema = {
  type: 'record',
  name: 'MyMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

const myKeySchema: Schema = {
  type: 'record',
  name: 'MyKey',
  fields: [{ name: 'id', type: 'int' }],
};

// Typescript types for the value schema
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
  const avroKafka = new AvroKafka(schemaRegistry, kafka);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group-key' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic-with-key' });

  // You need to specify that the key is encoded,
  // otherwise it would just be returned as Buffer
  // You can also pass the typescript type of the key
  await consumer.run<MyMessage, MyKey>({
    encodedKey: true,
    eachMessage: async ({ message }) => {
      console.log(message.key, message.value);
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();

  // To produce messages, specify the keySchema and the key typescript type
  await producer.send<MyMessage, MyKey>({
    topic: 'my-topic-with-key',
    schema: myValueSchema,
    keySchema: myKeySchema,
    messages: [{ value: { field1: 'my-string' }, key: { id: 111 } }],
  });
};

main();
