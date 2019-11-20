import { createCastle, produce, eachMessage } from '@ovotech/castle';
import { Event, EventSchema } from './avro';

// Define producers as pure functions
// With statically defining the typescript types and avro schemas
const mySender = produce<Event>({ topic: 'my-topic-1', schema: EventSchema });

// Define consumers as pure functions
// With statically defining which schemas it will accept
const eachEvent = eachMessage<Event>(async ({ message }) => {
  console.log(message.value);
});

const main = async () => {
  const castle = createCastle({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [{ topic: 'my-topic-1', groupId: 'my-group-1', eachMessage: eachEvent }],
  });

  // Start all consumers and producers
  await castle.start();

  await mySender(castle.producer, [{ value: { field1: 'my-string' } }]);
};

main();
