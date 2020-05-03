# Castle Stream

A node stream implementation of [@ovotech/castle](https://github.com/ovotech/castle). Intended for backfilling and testing.

## Usage

We can consume any stream of data, provided we specify a function to convert a record of that stream into a KafkaMessage.

> [examples/simple.ts](examples/simple.ts)

```typescript
import { Schema } from 'avsc';
import { ObjectReadableMock } from 'stream-mock';
import { createCastleStream, StreamKafkaMessage } from '@ovotech/castle-stream';

export interface Event1 {
  field1: string;
}

export const Event1Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

const main = async () => {
  const castleStream = createCastleStream({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: 'test1',
        source: new ObjectReadableMock(['test1', 'test2', 'test3']),
        eachMessage: async (message) => {
          console.log(message);
        },
        toKafkaMessage: (message: string): StreamKafkaMessage<Event1> => ({
          key: Buffer.from(''),
          value: { field1: message },
          schema: Event1Schema,
        }),
      },
    ],
  });

  await castleStream.start();
};

main();
```

## Multiple

We can also use multiple consumers as with normal castle instances. Each message can also contain information on which partition it was and other metadata. If we return that in the convertion function, it will show up accordingly.

> [examples/multiple.ts](examples/multiple.ts)

```typescript
import { Schema } from 'avsc';
import { ObjectReadableMock } from 'stream-mock';
import { createCastleStream } from '@ovotech/castle-stream';
import { CastleStreamConsumerConfig } from '../src';

export interface Event1 {
  field1: string;
}

export interface Event2 {
  field2: number;
}

export const Event1Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

export const Event2Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field2', type: 'int' }],
};

const consumer1: CastleStreamConsumerConfig<string, Event1> = {
  topic: 'test1',
  source: new ObjectReadableMock(['test1', 'test2', 'test3']),
  eachMessage: async ({ message }) => {
    console.log(message);
  },
  toKafkaMessage: (message) => ({
    key: Buffer.from(''),
    value: { field1: message },
    schema: Event1Schema,
  }),
};

/**
 * We can configure additional details of each message, like partition, offset, keys or other metadata and consume it in batches
 */
const consumer2: CastleStreamConsumerConfig<{ p: number; m: number; o: number }, Event2> = {
  topic: 'test2',
  source: new ObjectReadableMock([
    { p: 0, m: 5, o: 0 },
    { p: 1, m: 6, o: 1 },
    { p: 0, m: 7, o: 0 },
  ]),
  eachBatch: async ({ batch: { partition, messages } }) => {
    console.log(`P: ${partition}`, messages);
  },
  toKafkaMessage: (message) => ({
    partition: message.p,
    key: Buffer.from(''),
    value: { field2: message.m },
    offset: String(message.o),
    schema: Event1Schema,
  }),
};

const main = async () => {
  const castleStream = createCastleStream({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [consumer1, consumer2],
  });

  await castleStream.start();
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
