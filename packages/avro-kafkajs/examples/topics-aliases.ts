import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka, AvroProducer } from '@ovotech/avro-kafkajs';
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

const MY_TOPIC = 'myTopic';

// Statically define a producer that would send the correct message to the correct topic
const sendMyMessage = (producer: AvroProducer, message: MyMessage) =>
  producer.send<MyMessage>({
    topic: MY_TOPIC,
    schema: mySchema,
    messages: [{ value: message, key: null }],
  });

const main = async () => {
  const aliases = { [MY_TOPIC]: 'my-topic-long-v1' };
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });
  const avroKafka = new AvroKafka(schemaRegistry, kafka, aliases);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: MY_TOPIC });
  await consumer.run<MyMessage>({
    eachMessage: async ({ message }) => {
      console.log(message.value);
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();
  await sendMyMessage(producer, { field1: 'my-string' });
};

main();
