# Avro Timestamp Millis

A Logical type for representing a date stored as the number of milliseconds since epoch

### Using

```bash
yarn add @ovotech/avro-timestamp-millis
```

And then you can use `AvroEpochDays` for a logicalType of a field.

> [examples/simple.ts](examples/simple.ts)

```typescript
import { Type, Schema } from 'avsc';
import { AvroTimestampMillis } from '@ovotech/avro-timestamp-millis';

const eventSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    {
      name: 'field1',
      type: { type: 'long', logicalType: 'timestamp-millis' },
    },
  ],
};

const EventType = Type.forSchema(eventSchema, {
  logicalTypes: { 'timestamp-millis': AvroTimestampMillis },
});

const encoded = EventType.toBuffer({ field1: new Date('2020-01-01') });
const decoded = EventType.fromBuffer(encoded);

console.log(decoded);
```

It also supports schema evolution from int, logical:date and string types

> [examples/evolution.ts](examples/evolution.ts)

```typescript
import { Type, Schema } from 'avsc';
import { AvroTimestampMillis } from '@ovotech/avro-timestamp-millis';

const previousSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    {
      name: 'field1',
      type: { type: 'string' },
    },
  ],
};

const eventSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    {
      name: 'field1',
      type: { type: 'long', logicalType: 'timestamp-millis' },
    },
  ],
};

const PreviousType = Type.forSchema(previousSchema);
const EventType = Type.forSchema(eventSchema, {
  logicalTypes: { 'timestamp-millis': AvroTimestampMillis },
});
const previousTypeResolver = EventType.createResolver(PreviousType);

const encoded = PreviousType.toBuffer({ field1: '2020-01-01' });
const decoded = EventType.fromBuffer(encoded, previousTypeResolver);

console.log(decoded);
```

## Running the tests

Then you can run the tests with:

```bash
yarn test
```

### Coding style (linting, etc) tests

Style is maintained with prettier and tslint

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
