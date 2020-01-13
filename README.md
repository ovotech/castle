# Castle

A framework around [kafka.js](https://github.com/tulios/kafkajs) to transparently use [Schema Registry](https://www.confluent.io/confluent-schema-registry/) and create an application that consumes, produces, and reacts to different kafka topics. Supports consumption in batches or in parallel. Statically define and verify the schemas / message types in TypeScript

Packages:

- [@ovotech/avro-kafkajs](packages/avro-kafkajs) - wrapper around [kafka.js](https://github.com/tulios/kafkajs) to use [Schema Registry](https://www.confluent.io/confluent-schema-registry/)
- [@ovotech/blaise](packages/blaise/README.md) | - [@ovotech/castle](https://npmjs.com/@ovotech/castle) combined with [@ovotech/avro-mock-generator](https://npmjs.com/@ovotech/avro-mock-generator)
- [@ovotech/castle](packages/castle) - core service server
- [@ovotech/castle-cli](packages/castle-cli) - cli for interacting with kafka and [Schema Registry](https://www.confluent.io/confluent-schema-registry/)

## Usage

```shell
yarn add @ovotech/castle
```

> [examples/simple.ts](packages/castle/examples/simple.ts)

```typescript
import { createCastle, produce, consumeEachMessage } from '@ovotech/castle';
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

  await mySender(castle.producer, [{ value: { field1: 'my-string' } }]);
};

main();
```

You can connect to multiple topics, each of which is will have its own independent consumer group.
More about castle package in [packages/castle/README.md](packages/castle/README.md)

## Command line usage

```bash
yarn global add @ovotech/castle-cli
```

You can read about the various commands available with

```bash
castle --help
```

There are 4 main subcommand groups:

- **castle topic**: Subcommands for searching and manipulating kafka topics, as well as producing and consuming events from them.
- **castle schema**: Subcommands for getting schema versions of kafka topics.
- **castle config**: Subcommands to create / edit connection configs to kafka brokers and schema registers, that can be used by other commands.
- **castle group**: Subcommands to manipulate consumer group offsets.

You can configure access to the kafka to your server named `uat`, if you have the tls key, cert and certificate authority as text files. The schema registry is set as a url, any username and password can be set with a url provided auth like: `http://user:pass@localhost:8081`. The config file is saved to `$HOME/.castle-cli/` folder.

```bash
castle config set uat --kafka-broker localhost:3203 --key private.pem --ca ca.pem --cert cert.pem --schema-registry http://localhost:8081
```

After that is set you can use it in any command by stating `--config uat` (or `-C uat`):

```
castle --config uat schema search my-topic
castle --config uat schema show my-topic-full-name
castle --config uat topic search my-topic
castle --config uat topic consume my-topic-full-name
```

Using it without a specified config would connect to the default local kafka server.

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

## Why Castle?

It's Kafka's greatest work :)
