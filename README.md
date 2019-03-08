# Avro Ts CLI

CLI tool to convert avro schemas (avsc files) into typescript types, using [@ovotech/avro-ts](../avro-ts)

## Using with CLI

```bash
yarn add @ovotech/avro-ts-cli
yarn avro-ts convert avro/*.avsc --output-dir __generated__/
```

If no output dir is provided, the avsc files will be generated alongside the source files

```bash
yarn avro-ts convert avro/*.avsc
```

Logical types are also supported:

```bash
yarn avro-ts convert avro/*.avsc --logical-type date=string --logical-type timestamp-millis=string
```

## Running the tests

You can run the tests with:

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

## Responsible Team

- OVO Energy's Boost Internal Tools (BIT)

## License

This project is licensed under Apache 2 - see the [LICENSE](LICENSE) file for details
