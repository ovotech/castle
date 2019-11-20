# Avro Kafkajs

A wrapper around [Kafka.js](https://github.com/tulios/kafkajs) to transparently use [Schema Registry](https://www.confluent.io/confluent-schema-registry/) for producing and consuming messages with [Avro schema](https://en.wikipedia.org/wiki/Apache_Avro).

### Usage

```shell
yarn add @ovotech/avro-kafkajs
```

> [examples/class.ts](examples/class.ts)

```typescript
import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
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

const main = async () => {
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });
  const avroKafka = new AvroKafka(schemaRegistry, kafka);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic' });
  await consumer.run<MyMessage>({
    eachMessage: async ({ message }) => {
      console.log(message.value);
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();
  await producer.send<MyMessage>({
    topic: 'my-topic',
    schema: mySchema,
    messages: [{ value: { field1: 'my-string' } }],
  });
};

main();
```

It is a wrapper around [Kafka.js](https://github.com/tulios/kafkajs) with all of its functionality as is. With the one addition of requiring an `schema` field for the [Avro schema](https://en.wikipedia.org/wiki/Apache_Avro) when sending messages. Decoding of messages when consuming messages or batches happens automatically.

### Using Schema Registry directly

You can also use schema registry directly to encode and decode messages.

> [examples/schema-registry.ts](examples/schema-registry.ts)

```typescript
import { Kafka } from 'kafkajs';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
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

const main = async () => {
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });

  // Consuming
  const consumer = kafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic' });
  await consumer.run({
    eachMessage: async ({ message }) => {
      const value = await schemaRegistry.decode<MyMessage>(message.value);
      console.log(value);
    },
  });

  // Producing
  const producer = kafka.producer();
  await producer.connect();

  const value = await schemaRegistry.encode<MyMessage>('my-topic', mySchema, {
    field1: 'my-string',
  });
  await producer.send({ topic: 'my-topic', messages: [{ value }] });
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
