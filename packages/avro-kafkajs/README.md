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

### Encoded keys

Encoding keys with avro is also supported:

> [examples/encoded-key.ts](examples/encoded-key.ts)

```typescript
import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';

const myValueSchema: Schema = {
  type: 'record',
  name: 'MyMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

const myKeySchema: Schema = {
  type: 'record',
  name: 'MyKey',
  fields: [{ name: 'id', type: 'int' }],
};

// Typescript types for the value schema
interface MyMessage {
  field1: string;
}

// Typescript types for the key schema
interface MyKey {
  id: number;
}

const main = async () => {
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });
  const avroKafka = new AvroKafka(schemaRegistry, kafka);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group-key' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic-with-key' });

  // You need to specify that the key is encoded,
  // otherwise it would just be returned as Buffer
  // You can also pass the typescript type of the key
  await consumer.run<MyMessage, MyKey>({
    encodedKey: true,
    eachMessage: async ({ message }) => {
      console.log(message.key, message.value);
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();

  // To produce messages, specify the keySchema and the key typescript type
  await producer.send<MyMessage, MyKey>({
    topic: 'my-topic-with-key',
    schema: myValueSchema,
    keySchema: myKeySchema,
    messages: [{ value: { field1: 'my-string' }, key: { id: 111 } }],
  });
};

main();
```

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

const myKeySchema: Schema = {
  type: 'record',
  name: 'MyKey',
  fields: [{ name: 'id', type: 'int' }],
};

// Typescript types for the schema
interface MyMessage {
  field1: string;
}

// Typescript types for the key schema
interface MyKey {
  id: number;
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
      const key = await schemaRegistry.decode<MyKey>(message.key);
      console.log(value, key);
    },
  });

  // Producing
  const producer = kafka.producer();
  await producer.connect();

  // Encode the value
  const value = await schemaRegistry.encode<MyMessage>({
    topic: 'my-topic',
    schemaType: 'value',
    schema: mySchema,
    value: {
      field1: 'my-string',
    },
  });

  // Optionally encode the key
  const key = await schemaRegistry.encode<MyKey>({
    topic: 'my-topic',
    schemaType: 'key',
    schema: myKeySchema,
    value: {
      id: 10,
    },
  });
  await producer.send({ topic: 'my-topic', messages: [{ value, key }] });
};

main();
```

## Topic Aliases

You can define aliases to the topic names you want to listen to or produce messages for.
This can be used to encapsulate the real topic names, and use compile-time checked alias names throught your code.

> [examples/topics-aliases.ts](examples/topics-aliases.ts)

```typescript
import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka, AvroProducer } from '@ovotech/avro-kafkajs';
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

const MY_TOPIC = 'myTopic';

// Statically define a producer that would send the correct message to the correct topic
const sendMyMessage = (producer: AvroProducer, message: MyMessage) =>
  producer.send<MyMessage>({
    topic: MY_TOPIC,
    schema: mySchema,
    messages: [{ value: message, key: null }],
  });

const main = async () => {
  const aliases = { [MY_TOPIC]: 'my-topic-long-v1' };
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });
  const avroKafka = new AvroKafka(schemaRegistry, kafka, aliases);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: MY_TOPIC });
  await consumer.run<MyMessage>({
    eachMessage: async ({ message }) => {
      console.log(message.value);
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();
  await sendMyMessage(producer, { field1: 'my-string' });
};

main();
```

## Schema evolution / Multiple schemas per topic

We can easily produce / consume different schemas for the same topic as the encoding / decoding logic will take it into account

> [examples/schema-evolution.ts](examples/schema-evolution.ts)

```typescript
import { Kafka } from 'kafkajs';
import { SchemaRegistry, AvroKafka } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';

const myOldSchema: Schema = {
  type: 'record',
  name: 'MyOldMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

// Backwards compatible schema change
const myNewSchema: Schema = {
  type: 'record',
  name: 'MyNewMessage',
  fields: [
    { name: 'field1', type: 'string' },
    { name: 'field2', type: 'string', default: 'default-value' },
  ],
};

// Typescript types for the schema
interface MyOldMessage {
  field1: string;
}

interface MyNewMessage {
  field1: string;
  field2?: string;
}

const main = async () => {
  const schemaRegistry = new SchemaRegistry({ uri: 'http://localhost:8081' });
  const kafka = new Kafka({ brokers: ['localhost:29092'] });
  const avroKafka = new AvroKafka(schemaRegistry, kafka);

  // Consuming
  const consumer = avroKafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic-evolution' });
  await consumer.run<MyOldMessage | MyNewMessage>({
    eachMessage: async ({ message }) => {
      if ('field2' in message.value) {
        // Typescript Type would match MyNewMessage
        console.log('new message', message.value.field2);
      } else {
        // Typescript Type would match MyOldMessage
        console.log('old message', message.value.field1);
      }
    },
  });

  // Producing
  const producer = avroKafka.producer();
  await producer.connect();
  await producer.send<MyOldMessage>({
    topic: 'my-topic-evolution',
    schema: myOldSchema,
    messages: [{ value: { field1: 'my-string' }, key: null }],
  });
  await producer.send<MyNewMessage>({
    topic: 'my-topic-evolution',
    schema: myNewSchema,
    messages: [{ value: { field1: 'my-string', field2: 'new-string' }, key: null }],
  });
};

main();
```

## Custom schema registry subjects

If the subject for a topic in schema registry is already created, you can specify it directly to produce a message with the desired schema registry subject. It will take the latest version of the subject.

> [examples/custom-subject.ts](examples/custom-subject.ts)

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
    messages: [{ value: { field1: 'my-string' }, key: null }],
  });

  // Producing with custom subject
  await producer.send<MyMessage>({
    topic: 'my-topic',
    subject: 'my-topic-value',
    messages: [{ value: { field1: 'my-string-2' }, key: null }],
  });
};

main();
```

## Writing backfillers

Sometimes you'll want to write some code to backfill consumption using different data types, or test out consumption code. This package includes a transform stream to allow you to write a node stream -> batch payloads.

> [examples/stream.ts](examples/stream.ts)

```typescript
import { AvroTransformBatch } from '@ovotech/avro-kafkajs';
import { Schema } from 'avsc';
import { ObjectReadableMock } from 'stream-mock';

const mySchema: Schema = {
  type: 'record',
  name: 'MyMessage',
  fields: [{ name: 'field1', type: 'string' }],
};

// Typescript types for the schema
interface MyMessage {
  field1: string;
}

const data = new ObjectReadableMock(['one', 'two', 'three']);

const main = async () => {
  const transform = new AvroTransformBatch<string, MyMessage, null>({
    topic: 'test',
    toKafkaMessage: (message) => ({
      value: { field1: message },
      key: null,
      schema: mySchema,
    }),
  });

  data.pipe(transform).on('data', (payload) => console.log(payload.batch.messages));
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

Deployment is preferment by lerna automatically on merge / push to main, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
