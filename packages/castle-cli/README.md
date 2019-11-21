# Castle CLI

A command line wrapper around [Kafka.js](https://github.com/tulios/kafkajs) to transparently use [Schema Registry](https://www.confluent.io/confluent-schema-registry/) for producing and consuming messages with [Avro schema](https://en.wikipedia.org/wiki/Apache_Avro).

### Usage

```shell
yarn global add @ovotech/castle-cli
```

```shell
castle --help
castle topic my-topic
castle consume my-topic
castle produce-message my-topic --shema my-schema.json --message '{"field1":"value"}'
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
