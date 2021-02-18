# Blaise

An API to generate mock payloads for [@ovotech/castle](https://npmjs.com/@ovotech/castle) using [@ovotech/avro-mock-generator](https://npmjs.com/@ovotech/avro-mock-generator)

## Usage

### Concept

`blaise()` is mostly just a chainable deepMerge, with utilities to generate messages and payloads once everything is configured.

Calling `blaise()` returns a new version of blaise, preloaded with the provided defaults, without mutating the parent.

> [examples/chain.ts](examples/chain.ts)

```typescript
import blaise from '@ovotech/blaise';

const withAvro = blaise({ avro: { schema } });
const coffee = withAvro({ avro: { pickUnion: ['coffee'] } });
const tea = withAvro({ avro: { pickUnion: ['tea'] } });

coffee.getDefault(); // { avro: { schema, pickUnion: ['coffee']}}
tea.getDefault(); // { avro: { schema, pickUnion: ['tea']}}
```

### Generate an Avro Message

> [examples/avro-message.ts](examples/avro-message.ts)

```typescript
import blaise from '@ovotech/blaise';

const schema: avsc.RecordType = {
  type: 'record',
  name: '',
  fields: [{ name: 'anInt', type: 'int' }],
};
type MyType = { anInt: number };
blaise<MyType>({ avro: { schema } }).message(); // {topic: '', {anInt: 32}, [...]}
```

You can also override the message, either as part of the default or when calling the function

> [examples/avro-message-override.ts](examples/avro-message-override.ts)

```typescript
import blaise from '@ovotech/blaise';

const schema: avsc.RecordType = {
  // [...]
};
const brewCoffee = blaise({
  avro: { schema },
  message: { value: { type: 'coffee' } },
});
brewCoffee.message({ value: { with: 'milk' } }); // {offset: 13, value {type: 'coffee', with: 'milk'}, [...]}
```

### Generate a `CastleEachMessagePayload`

> [examples/each-message.ts](examples/each-message.ts)

```typescript
import blaise from '@ovotech/blaise'

const schema: avsc.RecordType = {
  // [...]
};
blaise({ avro: { schema }).eachMessage(); // { topic: 'aTopic', value: {} [...]}

```

### Generate a `CastleEachBatchPayload`

> [examples/each-batch.ts](examples/each-batch.ts)

```typescript
import blaise from '@ovotech/blaise'

const schema: avsc.RecordType = {
  // [...]
};
const makeMessage = blaise({ avro: { schema })
blaise.eachBatch([makeMessage()]); // {batch: { topic: 'aTopic', value: {} }[...]}

```

### Deterministic generation

Make use of the `seed` options to use a deterministic random generator instead of true randomness.

Each call to `.defaults()` or `.seed()` with a seed will reset the randomness.

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

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests.

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details

## What does the name mean?

It's just a fun pun. Take a Castle, make a 'mock' version of it, and you get Bristol's [Blaise Castle](https://en.wikipedia.org/wiki/Blaise_Castle_Estate)
