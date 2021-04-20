import {
  produce,
  consumeEachMessage,
  describeCastle,
  createKafka,
  createProducer,
  createConsumers,
  createCastleFromParts,
} from '@ovotech/castle';
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
  const kafka = createKafka({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
  });
  const producer = createProducer(kafka);
  const consumers = createConsumers(kafka, [
    { topic: 'my-topic-1', groupId: 'my-group-1', eachMessage: eachEvent },
  ]);
  const castle = createCastleFromParts({ kafka, producer, consumers });

  // Start all consumers and producers
  await castle.start();

  console.log(describeCastle(castle));

  // You can use the stand alone producer elsewhere
  await mySender(producer, [{ value: { field1: 'my-string' }, key: null }]);
};

main();
