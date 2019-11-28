# Laminar Open API

A framework around [kafka.js](https://github.com/tulios/kafkajs) to transparently use [Schema Registry](https://www.confluent.io/confluent-schema-registry/) and create an application that consumes, produces, and reacts to different kafka topics. Supports consumption in batches or in parallel. Statically define and verify the schemas / message types in TypeScript

Packages:

- [@ovotech/avro-kafkajs](packages/avro-kafkajs) - wrapper around [kafka.js](https://github.com/tulios/kafkajs) to use [Schema Registry](https://www.confluent.io/confluent-schema-registry/)
- [@ovotech/castle](packages/castle) - core service server
- [@ovotech/castle-cli](packages/castle-cli) - cli for interacting with kafka and [Schema Registry](https://www.confluent.io/confluent-schema-registry/)

## Usage


```shell
yarn add @ovotech/castle
```

> [examples/simple.ts](packages/castle/examples/simple.ts)

```typescript
import { createCastle, produce, eachMessage } from '@ovotech/castle';
import { Event, EventSchema } from './avro';

// Define producers as pure functions
// With statically setting the typescript types and avro schemas
const mySender = produce<Event>({ topic: 'my-topic-1', schema: EventSchema });

// Define consumers as pure functions
// With statically setting which types it will accept
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
```

You can connect to multiple topics, each of which is will have its own independent consumer group.
More about castle package in [packages/castle/README.md](packages/castle/README.md)

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
