import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
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
  const avroKafka = new AvroKafka(schemaRegistry, kafka);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic' });
  await consumer.run<MyMessage>({
    eachMessage: async ({ message }) => {
      console.log(message.value);
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();
  await producer.send<MyMessage>({
    topic: 'my-topic',
    schema: mySchema,
    messages: [{ value: { field1: 'my-string' } }],
  });
};

main();
