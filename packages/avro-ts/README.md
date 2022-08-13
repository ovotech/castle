# Avro TS

Generate typescript from avro types.

Uses typescript's compiler api to convert avro to typescript AST, and pretty prints the results.

### Using

```bash
yarn add @ovotech/avro-ts
```

And then you can use the function to get typescript types:

> [examples/simple.ts](examples/simple.ts)

```typescript
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'username', type: 'string' },
  ],
};

const ts = toTypeScript(avro);

console.log(ts);
```

Resulting TypeScript:

```typescript
export type AvroType = User;

export interface User {
  id: number;
  username: string;
}
```

### Logical Types

Avro has [logical types](https://github.com/mtth/avsc/wiki/Advanced-usage#logical-types). In their docs:

> The built-in types provided by Avro are sufficient for many use-cases, but it can often be much more convenient to work with native JavaScript objects.

To support them we need to modify the typescript generation to use the typescript type instead of the logical type. If we don't avro-ts will fall back on the original underlying type.

> [examples/logical-types.ts](examples/logical-types.ts)

```typescript
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'createdAt', type: { type: 'long', logicalType: 'timestamp-millis' } },
  ],
};

const ts = toTypeScript(avro, {
  logicalTypes: {
    'timestamp-millis': 'string',
  },
});

console.log(ts);
```

Resulting TypeScript:

```typescript
export type AvroType = Event;

export interface Event {
  id: number;
  createdAt: string;
}
```

We can also use custom classes for our logical types. It will also add the code to import the module.

> [examples/custom-logical-types.ts](examples/custom-logical-types.ts)

```typescript
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'decimalValue', type: { type: 'long', logicalType: 'decimal' } },
    { name: 'anotherDecimal', type: { type: 'long', logicalType: 'decimal' } },
  ],
};

const ts = toTypeScript(avro, {
  logicalTypes: {
    decimal: { module: 'decimal.js', named: 'Decimal' },
  },
});

console.log(ts);
```

Resulting TypeScript:

```typescript
import { Decimal } from 'decimal.js';

export type AvroType = Event;

export interface Event {
  id: number;
  decimalValue: Decimal;
  anotherDecimal: Decimal;
}
```

## Wrapped Unions

Avro Ts attempts to generate the types of the "auto" setting for wrapped unions. https://github.com/mtth/avsc/wiki/API#typeforschemaschema-opts This would mean that unions of records would be wrapped in an object with namespaced keys.

The typescript interfaces are also namespaced appropriately. Avro namespaces like 'com.example.avro' are converted into `ComExampleAvro` namespaces in TS.

> [examples/wrapped-union.ts](examples/wrapped-union.ts)

```typescript
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  namespace: 'com.example.avro',
  fields: [
    { name: 'id', type: 'int' },
    {
      name: 'event',
      type: [
        {
          type: 'record',
          name: 'ElectricityEvent',
          fields: [
            { name: 'accountId', type: 'string' },
            { name: 'MPAN', type: 'string' },
          ],
        },
        {
          type: 'record',
          name: 'GasEvent',
          fields: [
            { name: 'accountId', type: 'string' },
            { name: 'MPRN', type: 'string' },
          ],
        },
      ],
    },
  ],
};

const ts = toTypeScript(avro);

console.log(ts);
```

Which would result in this typescript:

```typescript
/* eslint-disable @typescript-eslint/no-namespace */

export type Event = ComExampleAvro.Event;

export namespace ComExampleAvro {
  export const ElectricityEventName = 'com.example.avro.ElectricityEvent';
  export interface ElectricityEvent {
    accountId: string;
    MPAN: string;
  }
  export const GasEventName = 'com.example.avro.GasEvent';
  export interface GasEvent {
    accountId: string;
    MPRN: string;
  }
  export const EventName = 'com.example.avro.Event';
  export interface Event {
    id: number;
    event:
      | {
          'com.example.avro.ElectricityEvent': ComExampleAvro.ElectricityEvent;
          'com.example.avro.GasEvent'?: never;
        }
      | {
          'com.example.avro.ElectricityEvent'?: never;
          'com.example.avro.GasEvent': ComExampleAvro.GasEvent;
        };
  }
}
```

Notice that not only the interfaces themselves are exported, but their fully qualified names as well. This should help to improve readability.

We also breakout the root type from its namespace for ease of use.

```typescript
import { ComExampleAvro as NS, Event } from '...';

const elecEvent: Event = {
  id: 10,
  event: { [NS.ElectricityEventName]: { MPAN: '111', accountId: '123' } },
};

const gasEvent: Event = {
  id: 10,
  event: { [NS.GasEventName]: { MPRN: '222', accountId: '123' } },
};
```

## Defaults as optional

If you are creating avro objects, that have defaults in their schema, then by definition they are optional. It is not possible to express those default values in TypeScript so that one interface works for both creating and reading objects with default values. That's why we provide a flag to specify that we want the values that have defaults to be optional.

You can generate 2 sets of types - one for consuming one for producing avro objects this way.

> [examples/defaults-as-optional.ts](examples/defaults-as-optional.ts)

```typescript
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'username', type: 'string', default: 'Simon' },
  ],
};

const ts = toTypeScript(avro, { defaultsAsOptional: true });

console.log(ts);
```

## Typescript Enums

By default AVRO enums are converted to a string union. If you prefer to use Typescript enums instead, you can use withTypescriptEnums option.

> [examples/with-typescript-enums.ts](examples/with-typescript-enums.ts)

```typescript
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id', type: 'int' },
    {
      "name": "status",
      "type": { "type": "enum", "name": "Status", "symbols": ["Active", "Inactive"] },
      "doc": "The status of the user account"
    },
  ],
};

const ts = toTypeScript(avro, { withTypescriptEnums: true });

console.log(ts);
```

## External references

AvroTs supports external references to schemas in other files. In order to do that you'll need to convert the external schemas first, and then pass them as "external" in the initial context. This can be used as a building blocks to process multiple schemas at once.

> [examples/external.ts](examples/external.ts)

```typescript
import { toTypeScript, toExternalContext } from '@ovotech/avro-ts';
import { readFileSync } from 'fs';
import { join } from 'path';

const createUserSchema = JSON.parse(
  readFileSync(join(__dirname, 'external-CreateUser.json'), 'utf-8'),
);
const addressSchema = JSON.parse(readFileSync(join(__dirname, 'external-Address.json'), 'utf-8'));

const addressContext = toExternalContext(addressSchema);

const ts = toTypeScript(createUserSchema, { external: { './external-Address': addressContext } });

console.log(ts);
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
