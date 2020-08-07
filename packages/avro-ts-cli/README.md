# Avro Typecript CLI

Command line tool to convert [Avro Schemas](https://avro.apache.org/docs/current/spec.html) into typescript files. More precicely it generates the typescript that would describe the objects that [avsc](https://github.com/mtth/avsc) produces.

![Usage Example](./docs/avro-ts.svg)

## Usage

```shell
yarn global add @ovotech/avro-ts-cli

avro-ts --help
avro-ts avro-schema-file.json
avro-ts avro-dir/*.json
avro-ts avro-dir/*.json --output-dir src/__generated__/
avro-ts avro-dir/*.json --logical-type date=string
```

Options:

- `-h, --help` - output usage information
- `-e, --defaults-as-optional` - Fields with defaults as optional
- `-O, --output-dir <outputDir>` - Directory to write typescript files to
- `--logical-type <logicalType>` - Logical type, example: date=string (default: {})
- `--logical-type-import <logicalType>` - Logical type import custom module, example: date=Decimal:decimal.js (default: {})
- `--logical-type-import-all <logicalType>`- Logical type import custom module as \*, example: date=Decimal:decimal.js (default: {})
- `--logical-type-import-default <logicalType>`- Logical type import custom module as default, example: date=Decimal:decimal.js (default: {})
- `-h, --help` - output usage information

## Logical Types

Avro has [logical types](https://github.com/mtth/avsc/wiki/Advanced-usage#logical-types). In their docs:

> The built-in types provided by Avro are sufficient for many use-cases, but it can often be much more convenient to work with native JavaScript objects.

To support them we need to modify the typescript generation to use the typescript type instead of the logical type. If we don't avro-ts will fall back on the original underlying type.

If we had this json avro schema:

> [examples/event-1.json](examples/event-1.json)

```json
{
  "type": "record",
  "name": "Event",
  "fields": [
    { "name": "id", "type": "int" },
    { "name": "createdAt", "type": { "type": "int", "logicalType": "date" } }
  ]
}
```

```shell
avro-ts examples/event-1.json --logical-type date=string
```

THis would output this file. Notice that the type of `createdAt` is not `int` but `string`. This is the logical types in action.

> [examples/event-1.json.ts](examples/event-1.json.ts)

```typescript
export type AvroType = Event;

export interface Event {
  id: number;
  createdAt: number;
}
```

## Custom logical types

We can also use custom classes for our logical types. It will also add the code to import the module.

> [examples/event-2.json](examples/event-2.json)

```json
{
  "type": "record",
  "name": "Event",
  "fields": [
    { "name": "id", "type": "int" },
    { "name": "decimalValue", "type": { "type": "long", "logicalType": "decimal" } },
    { "name": "anotherDecimal", "type": { "type": "long", "logicalType": "decimal" } }
  ]
}
```

```shell
avro-ts examples/event-2.json --logical-type-import decimal=Decimal:decimal.js
```

> [examples/event-2.json.ts](examples/event-2.json.ts)

```typescript
export type AvroType = Event;

export interface Event {
  id: number;
  decimalValue: number;
  anotherDecimal: number;
}
```

If you need to use a default import you can use `--logical-type-import-default`

```shell
avro-ts examples/event-2.json --logical-type-import-default decimal=Decimal:decimal.js
```

```typescript
import Decimal from 'decimal.js';
```

And ``--logical-type-import-all` for a synthetic default import

```shell
avro-ts examples/event-2.json --logical-type-import-all decimal=Decimal:decimal.js
```

```typescript
import * as Decimal from 'decimal.js';
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

### Screencasting

We use [termtosvg](https://github.com/nbedos/termtosvg) to generate the docs svg aniamtion.

```shell
termtosvg record -g 100x35 docs/avro-ts.cast
...
termtosvg render docs/avro-ts.cast docs/avro-ts.svg -D 5000 -M 150 -t docs/template.svg
```

First we record the cast, then we modify it as necessary (remove exit at the end) then we render it to an svg.

## Deployment

Deployment is preferment by lerna automatically on merge / push to master, but you'll need to bump the package version numbers yourself. Only updated packages with newer versions will be pushed to the npm registry.

## Contributing

Have a bug? File an issue with a simple example that reproduces this so we can take a look & confirm.

Want to make a change? Submit a PR, explain why it's useful, and make sure you've updated the docs (this file) and the tests (see [test folder](test)).

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
