# Avro Decimal

A Logical type for representing a decimal object value as raw bytes

### Using

```bash
yarn add @ovotech/avro-decimal
```

And then you can use `AvroDecimal` for a logicalType of a field.

> [examples/simple.ts](examples/simple.ts)

```typescript
import { Type, Schema } from 'avsc';
import { AvroDecimal } from '@ovotech/avro-decimal';
import { Decimal } from 'decimal.js';

const decimalSchema: Schema = {
  type: 'bytes',
  logicalType: 'decimal',
  precision: 16,
  scale: 8,
};

export const DecimalType = Type.forSchema(decimalSchema, {
  logicalTypes: { decimal: AvroDecimal },
});

const encoded = DecimalType.toBuffer(new Decimal('100.01'));
const decoded = DecimalType.fromBuffer(encoded);

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
