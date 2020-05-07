# Castle CLI

A command line wrapper around [Kafka.js](https://github.com/tulios/kafkajs) to transparently use [Schema Registry](https://www.confluent.io/confluent-schema-registry/) for producing and consuming messages with [Avro schema](https://en.wikipedia.org/wiki/Apache_Avro).

## Usage

```shell
yarn global add @ovotech/castle-cli
```

```shell
castle --help
castle topic search my-topic
castle topic message my-topic --shema-file my-schema.json --message '{"field1":"value"}'
castle topic consume my-topic
```

## Configuration

If you want to connect to external kafka (and schema registry) servers you'll want to define some configuration files.

For example if we wanted to connect to:

- Schema Registry `registry.example.com`, port `2222` with username `foo` and password `bar`
- Kafka Broker at `broker.example.com`, port `3333`, with specific tls keys and certs

The config would be a json file that looks like this

```json
{
  "schemaRegistry": {
    "uri": "https://foo:bar@registry.example.com:2222"
  },
  "kafka": {
    "brokers": ["broker.example.com:3333"],
    "ssl": {
      "ca": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n",
      "cert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n",
      "key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
    }
  }
}
```

The "schemaRegistry" config object is the configuration you'll send to `SchemaRegistry` from [@ovotech/avro-kafkajs](https://github.com/ovotech/castle/tree/master/packages/avro-kafkajs). Here are some docs for all the possible arguments https://github.com/ovotech/castle/tree/master/packages/avro-kafkajs#using-schema-registry-directly

The "kafka" config object is the config for [kafkajs](https://kafka.js.org) itself which you can read about in their excelent documentation https://kafka.js.org/docs/configuration

### Configuration File

When you have a file like that saved somewhere you can use it with the `--config` option

```shell
castle topic search my-topic --config ~/path/to/config.json
```

### Configuration Folder

You can store the config inside `~/.castle-cli` folder which is also searched when you use the `--config` option

```shell
castle topic search my-topic --config config.json
```

You can also define the configuration directly using the config commands

```shell
castle config set my-env \
  --kafka-broker broker.example.com:3333 \
  --key private.pem \
  --ca ca.pem \
  --cert cert.pem \
  --schema-registry https://foo:bar@registry.example.com:2222`

castle topic search my-topic --config my-env
```

## Topics

To consume and produce messages in kafka topics as well as inspect and modify the topics themselves, you can use the `topic` group of commands.

![Topic Example](./docs/topic.svg)

You can see all of the available commands with `help`.

### castle topic show

Show partition, offsets and config entries of a topic.

```shell
castle topic show my-topic
castle topic show my-topic -vv
castle topic show my-topic --json
```

Options:

- `-J, --json` - output as json
- `-C, --config <configFile>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

### castle topic update

Update config entries of a topic.
All the available topic configurations can be found in the confluent documentation https://docs.confluent.io/current/installation/configuration/topic-configs.html

```shell
castle topic update my-topic --config-entry file.delete.delay.ms=40000
castle topic update my-topic --config-entry file.delete.delay.ms=40000 -vv
```

### castle topic search

Get list of topics. If you don't specify a search string returns all of them.

Options:

- `-J, --json` - output as json
- `-C, --config <configFile>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

```shell
castle topic search
castle topic search my-to
castle topic search my-to -vv
castle topic search my-topic --json
```

### castle topic create

Create a topic. Can specify number of partitions, replaction factors and config entries.

Options:

- `-P, --num-partitions <partitions>` - number of partitions (default: 1)
- `-R, --replication-factor <factor>` - replication Factor (default: 1)
- `-E, --config-entry <entry>` - set a config entry, title=value, can use multiple times (default: [])
- `-C, --config <config>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

```shell
castle topic create my-topic
castle topic create my-topic -vvvv
castle topic create my-topic --num-partitions 2 --replication-factor 2 --config-entry file.delete.delay.ms=40000
```

### castle topic consume

Consume messages of a topic. Use schema registry to decode avro messages.
By default would use a new random consumer group id to retrieve all the messages and exit.

Using the `--json` option you will output the result as json, that can be then be used by "castle produce" command

Options:

- `-D, --depth <depth>` - depth for the schemas output (default: 5)
- `-G, --group-id <groupId>` - consumer group id, defaults to random uuid (default: "random group name")
- `-T, --tail` - start listening for new events
- `-J, --json` - output as json
- `-K, --encoded-key` - Decode the key with avro schema too
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-C, --config <configFile>` - config file with connection deails
- `-h, --help` - output usage information

```shell
castle topic consume my-topic
castle topic consume my-topic -vvvv
castle topic consume my-topic --tail
castle topic consume my-topic --group-id my-group-id
castle topic consume my-topic --json
```

### castle topic produce

Produce messages for a topic.
Using a file that contains schema, topic and messages to be produced.
Schemas for keys are supported with the "keySchema" field in the produce file.

Options:

- `-C, --config <configFile>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

```shell
castle topic produce my-produce-file.json
castle topic produce my-produce-file.json -vv
```

Example produce file:

```json
{
  "topic": "my-topic",
  "schema": {
    "name": "Event",
    "type": "record",
    "fields": [{ "name": "field1", "type": "string" }]
  },
  "messages": [{ "partition": 0, "value": { "field1": "test1" } }]
}
```

### castle topic message

Produce an ad-hoc message for a topic.
You need to specify schema file (with --schema-file) and message content as json (--message).
If you define --key-schema-file as well you can encode your keys too.

Options:

- `-P, --partition <partition>` - the partion to send this on
- `-K, --key <key>` - message key
- `-M, --message <message>` - the JSON message to be sent
- `-S, --schema-file <schema>` - path to the schema file
- `-E, --key-schema-file <schema>` - optional path to the key schema file
- `-C, --config <config>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

```shell
castle topic message my-topic --schema my-schema.json --message '{"text":"other"}'
castle topic message my-topic --schema my-schema.json --message '{"text":"other"}' -vvvv
```

## Schemas

To search for schemas in the schema registry you can use the `schema` group of commands.

![Schema Example](./docs/schema.svg)

You can see all of the available commands with `help`.

#### castle schema search

Search for schemas with the given name in the schema registry. If you don't specify a search string returns all of them.

Options:

- `-J, --json` - output as json
- `-C, --config <configFile>` - config file with connection deails
- `-h, --help` - output usage information

```shell
castle schema search
castle schema search my-to
castle schema search my-topic --json
```

### castle schema show

Show all the versions of a schema in the schema registry.

Options:

- `-D, --depth <depth>` - depth for the schemas output (default: 5)
- `-J, --json` - output as json
- `-C, --config <configFile>` - config file with connection deails
- `-h, --help` - output usage information

```shell
castle schema show my-topic --depth 7
castle schema show my-topic --json
```

## Groups

If you want to modify consumer groups and their offsets you can do that with the `group` commands

### castle group show

Show consumer group offsets for a topic.
Break it down by partition and calculate current lag (difference between current and latest offset)

Options:

- `-J, --json` - output as json
- `-C, --config <configFile>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

```shell
castle group show my-group-id my-topic
castle group show my-group-id my-topic -vv
castle group show my-group-id my-topic --json
```

### castle group update

Update consumer group offsets for a topic.
Requires either --reset-offsets or --set-offset options.

Options:

- `-R, --reset-offsets <earliest|latest>` - reset consumer group offset
- `-E, --set-offset <entry>` - set an offset, partition=offset, can use multiple times (default: [])
- `-C, --config <configFile>` - config file with connection deails
- `-v, --verbose` - Output logs for kafka, four levels: error, warn, info, debug. use flag multiple times to increase level
- `-h, --help` - output usage information

```shell
castle group update my-group-id my-topic --reset-offsets earliest
castle group update my-group-id my-topic --reset-offsets earliest -vv
castle group update my-group-id my-topic --set-offset 0=10 --set-offset 1=10
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
