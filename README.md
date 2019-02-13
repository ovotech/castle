# Avro TS

Generate typescript from avro types.

It consists of a very quick sequential, functional parser. No dependencies.

### Using

```bash
yarn add @ovotech/avro-ts
```

And then you can use the function to get typescript types:

```typescript
import { avroTs } from '@ovotech/avro-ts';

const avro: RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
const ts = avroTs(avro, { 'timestamp-millis': 'string', date: 'string' });

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

To deploy a new version, push to master and then create a new release. CircleCI will automatically build and deploy a the version to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see `test/index.spec.ts`).

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
