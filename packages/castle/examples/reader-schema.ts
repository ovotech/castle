import { createCastle, produce, consumeEachMessage, describeCastle } from '@ovotech/castle';
import { HeavySchema, Heavy, Light, LightSchema } from './avro';

// Define producers as pure functions
// With statically setting the typescript types and avro schemas
const mySender = produce<Heavy>({ topic: 'my-topic-2', schema: HeavySchema });

// Define consumers as pure functions
// With statically setting which types it will accept
const eachEvent = consumeEachMessage<Light>(async ({ message }) => {
  console.log(message.value);
});

const main = async () => {
  const castle = createCastle({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: 'my-topic-2',
        groupId: 'my-group-2',
        // Define the reader schema
        readerSchema: LightSchema,
        eachMessage: eachEvent,
      },
    ],
  });

  // Start all consumers and producers
  await castle.start();

  console.log(describeCastle(castle));

  await mySender(castle.producer, [
    { value: { userId: 123, actions: ['add', 'remove'], time: 100 }, key: null },
  ]);
};

main();
