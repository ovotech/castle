import { createCastle, produce, consumeEachMessage, describeCastle } from '@ovotech/castle';
import { env } from 'process';
import { Event, EventSchema } from './avro';

// Define producers as pure functions
// With statically setting the typescript types and avro schemas
const mySender = produce<Event>({ topic: 'my-topic-1', schema: EventSchema });

// Define consumers as pure functions
// With statically setting which types it will accept
const eachEvent = consumeEachMessage<Event>(async ({ message }) => {
  console.log(message.value);
});

const main = async () => {
  const castle = createCastle({
    // You can pass the username and password in the uri string to the schema registry
    schemaRegistry: { uri: 'http://username@password:localhost:8081' },
    kafka: {
      brokers: ['localhost:29092'],
      // Pass ssl certs to kafkajs
      ssl: {
        ca: env.KAFKA_SSL_CA,
        key: env.KAFKA_SSL_KEY,
        cert: env.KAFKA_SSL_CERT,
      },
    },
    consumers: [{ topic: 'my-topic-1', groupId: 'my-group-1', eachMessage: eachEvent }],
  });

  // Start all consumers and producers
  await castle.start();

  console.log(describeCastle(castle));

  await mySender(castle.producer, [{ value: { field1: 'my-string' } }]);
};

main();
