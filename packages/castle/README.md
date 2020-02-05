# Castle

A framework around [Kafka.js](https://github.com/tulios/kafkajs) to transparently use [Schema Registry](https://www.confluent.io/confluent-schema-registry/) and create an application that consumes, produces, and reacts to different kafka topics. Supports consumption in batches or in parallel. Statically define and verify the schemas / message types in TypeScript

### Usage

```shell
yarn add @ovotech/castle
```

> [examples/simple.ts](examples/simple.ts)

```typescript
import { createCastle, produce, consumeEachMessage, describeCastle } from '@ovotech/castle';
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
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [{ topic: 'my-topic-1', groupId: 'my-group-1', eachMessage: eachEvent }],
  });

  // Start all consumers and producers
  await castle.start();

  console.log(describeCastle(castle));

  await mySender(castle.producer, [{ value: { field1: 'my-string' } }]);
};

main();
```

You can connect to multiple topics, each of which is will have its own independent consumer group.

You can also use schema registry directly to encode and decode messages.

> [examples/multiple-topics.ts](examples/multiple-topics.ts)

```typescript
import {
  createCastle,
  produce,
  consumeEachMessage,
  consumeEachBatch,
  describeCastle,
} from '@ovotech/castle';
import {
  StartEvent,
  StartEventSchema,
  FeedbackEvent,
  FeedbackEventSchema,
  CompleteEvent,
  CompleteEventSchema,
} from './avro';

enum Topic {
  Start = 'start',
  Complete = 'complete',
  Feedback = 'feedback',
  Batched = 'batched',
}

// Define multiple producers as pure functions
const sendStart = produce<StartEvent>({ topic: Topic.Start, schema: StartEventSchema });
const sendComplete = produce<CompleteEvent>({ topic: Topic.Complete, schema: CompleteEventSchema });
const sendFeedback = produce<FeedbackEvent>({ topic: Topic.Feedback, schema: FeedbackEventSchema });

// Define a consumer as a pure function
const eachStartEvent = consumeEachMessage<StartEvent>(async ({ message }) => {
  console.log(`Started Processing ${message.value.id}`);
});

// Define a batch consumer as a pure function
const eachBatchFeedbackEvent = consumeEachBatch<FeedbackEvent>(async ({ batch, producer }) => {
  console.log(`Feedback ${batch.messages.map(msg => `${msg.value.id}:${msg.value.status}`)}`);
  console.log('Sending complete events');
  sendComplete(
    producer,
    batch.messages.map(msg => ({ value: { id: msg.value.id } })),
  );
});

// Define a parallel consumer as a pure function
const eachCompleteEvent = consumeEachMessage<CompleteEvent>(async ({ message }) => {
  console.log(`Completed ${message.value.id}`);
});

const eachSizedBatch = consumeEachBatch(async ({ batch: { messages, partition } }) =>
  console.log('Batch Size', partition, messages.length),
);

const main = async () => {
  const castle = createCastle({
    // Setup topic aliases
    // You can use short statically checked names in the code,
    // but configure long environment specific kafka topic names
    topicsAlias: {
      [Topic.Start]: 'start-topic-name-1',
      [Topic.Feedback]: 'feedback-topic-name-1',
      [Topic.Complete]: 'complete-topic-name-1',
    },
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: Topic.Start,
        groupId: 'start-group-1',
        eachMessage: eachStartEvent,
      },
      {
        topic: Topic.Feedback,
        groupId: 'feedback-group-1',
        eachBatch: eachBatchFeedbackEvent,
      },
      {
        topic: Topic.Complete,
        groupId: 'complete-group-1',
        partitionsConsumedConcurrently: 2,
        eachMessage: eachCompleteEvent,
      },
      {
        topic: Topic.Batched,
        groupId: 'batched-group-1',
        /* Use eachSizedBatch to instruct castle to break down
         * Kafkajs batches into chunks of size up to maxBatchSize.
         *
         * Castle will handle heartbeats and nudging kafka to commitIfNecessary
         * after each chunk is processed.
         *
         * The consumer will be called sequentially for each chunk within
         * a given partition.
         */
        eachSizedBatch,
        maxBatchSize: 50,
      },
    ],
  });

  await castle.start();

  console.log(describeCastle(castle));

  // Perform a siqeunce of events
  // - send start events, wait a bit
  await sendStart(castle.producer, [{ value: { id: 10 } }, { value: { id: 20 } }]);

  // - wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // - send feedback events which would produce the complete events
  await sendFeedback(castle.producer, [
    { value: { id: 10, status: 'Sent' } },
    { value: { id: 20, status: 'Failed' } },
  ]);
};

main();
```

## Middlewares

Castle is designed to help building complex applications, where you want to share logic between consumers. This is achieved with building middlewares that process each consumer and add / modify it. Statically verified by typescript

> [examples/with-middlewares.ts](examples/with-middlewares.ts)

```typescript
import { createCastle, describeCastle, produce, consumeEachMessage } from '@ovotech/castle';
import { StartEvent, StartEventSchema, CompleteEvent, CompleteEventSchema } from './avro';
import {
  createDb,
  createLogging,
  DbContext,
  LoggingContext,
  createErrorHandling,
} from './middlewares';

const start = produce<StartEvent>({ topic: 'my-start-3', schema: StartEventSchema });
const complete = produce<CompleteEvent>({ topic: 'my-complete-3', schema: CompleteEventSchema });

const eachStart = consumeEachMessage<StartEvent, DbContext & LoggingContext>(
  async ({ message, db, logger, producer }) => {
    logger.log('Started', message.value.id);
    const { rows } = await db.query('SELECT avatar FROM users WHERE id = $1', [message.value.id]);
    logger.log('Found', rows, 'Sending Complete');
    complete(producer, [{ value: { id: message.value.id } }]);
  },
);

const eachComplete = consumeEachMessage<CompleteEvent, LoggingContext>(
  async ({ message, logger }) => {
    logger.log('Complete received for', message.value.id);
  },
);

const main = async () => {
  const db = createDb({
    user: 'boost-statements-api',
    database: 'boost-statements-api',
    password: 'dev-pass',
    host: '127.0.0.1',
  });
  const logging = createLogging(console);
  const errorHandling = createErrorHandling();

  const castle = createCastle({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: 'my-start-3',
        groupId: 'my-start-3',
        eachMessage: logging(errorHandling(db(eachStart))),
      },
      {
        topic: 'my-complete-3',
        groupId: 'my-complete-3',
        eachMessage: logging(errorHandling(eachComplete)),
      },
    ],
  });

  await castle.start();

  console.log(describeCastle(castle));

  await start(castle.producer, [{ value: { id: 1 } }]);
};

main();
```

## Running the tests

You can run the tests with:

```bash
yarn test
```

### Coding style (linting, etc) tests

Style is maintained with prettier and eslint

```
yarn lint
```

## Deployment

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
