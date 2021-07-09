import { createCastle, produce, consumeEachMessage, describeCastle } from '@ovotech/castle';
import { UserEvent as OldUserEvent } from './avro/OldSchema.avsc';
import { UserEvent as NewUserEvent } from './avro/NewSchema.avsc';
import { readFileSync } from 'fs';
import { join } from 'path';

const OldSchema = JSON.parse(readFileSync(join(__dirname, './avro/OldSchema.avsc'), 'utf-8'));
const NewSchema = JSON.parse(readFileSync(join(__dirname, './avro/NewSchema.avsc'), 'utf-8'));

// Define producers as pure functions
// With statically setting the typescript types and avro schemas
const mySender = produce<OldUserEvent>({ topic: 'my-topic-3', schema: OldSchema });

// Define consumers as pure functions
// With statically setting which types it will accept
const eachEvent = consumeEachMessage<NewUserEvent>(async ({ message }) => {
  console.log(message.value);
});

const main = async () => {
  const castle = createCastle({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: 'my-topic-3',
        groupId: 'my-group-3',
        // Define the new evolved schema
        readerSchema: NewSchema,
        eachMessage: eachEvent,
      },
    ],
  });

  // Start all consumers and producers
  await castle.start();

  console.log(describeCastle(castle));

  await mySender(castle.producer, [
    { value: { event: { 'com.myorg.identity.event.Deleted': { id: '123' } } }, key: null },
  ]);
};

main();
