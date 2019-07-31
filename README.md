# Avro TS

Generate typescript from avro types.

It consists of a very quick sequential, functional parser. Uses typescript's compiler api to convert avro to typescript AST, and pretty prints the results. No dependencies apart from typescript.

### Using

```bash
yarn add @ovotech/avro-ts
```

And then you can use the function to get typescript types:

```typescript
import { schema } from 'avsc';
import { avroTs } from '@ovotech/avro-ts';

const avro: schema.RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
const ts = avroTs(avro, {
  'timestamp-millis': 'string',
  date: 'string',
  decimal: {
    type: 'Decimal',
    import: "import { Decimal } from 'decimal.js'",
  },
});

console.log(ts);
```

## Support

This converter currently supports

- Record
- Union
- Map
- Logical Types
- Enum
- Map
- Array

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

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
