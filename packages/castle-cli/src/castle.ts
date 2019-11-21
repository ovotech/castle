import * as program from 'commander';

program
  .version('0.1.0')
  .description(
    `Castle CLI - a tool for inspecting kafka topics with schema registry.
Can create / modify topics with different permissions, consume and produce messages, inspect schemas and modify consumer group offsets.
By default connects to local kafka (localhost:29092) and schema registry (localhost:8081). But can define a config file that can be used to connect to external servers.

Example:
  castle topic my-topic
  castle consume my-topic
  castle config uat --kafka-broker example.com:3203 --key private.pem --ca ca.pem --cert cert.pem --schema-registry http://example.com:8081
  castle --config uat topic my-topic
`,
  )
  .command('config', 'Set / View a configuration file')
  .command('topic', 'List of topics filtered by a topic name')
  .command('topic-create', 'Create a topic')
  .command('topic-update', 'Update config entries of a topic')
  .command('topic-info', 'Partition, offsets and config entries of a topic')
  .command('schema', 'Avro schema information of topic')
  .command('group-info', 'Consumer group offsets for a topic')
  .command('group-update', 'Update consumer group offsets for a topic')
  .command('consume', 'Consume messages of a topic.')
  .command('produce', 'Produce messages for a topic')
  .command('produce-message', 'Produce an ad-hoc message for a topic')
  .parse(process.argv);
