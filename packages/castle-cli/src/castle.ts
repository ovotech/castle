import * as program from 'commander';

program
  .version('0.1.0')
  .description('Castle CLI')
  .command('schema [topic]', 'Inspect the schema of a topic')
  .command('group [name]', 'Inspect a group')
  .command('consume <topic>', 'Consume from a topic')
  .command('produce <file>', 'Produce events for a topic')
  .command('produce-message ', 'Produce a single ad-hoc message')
  .command('topic [name]', 'Get a list of topics filtered by a topic name')
  .command('topic-create <name>', 'Create a topic')
  .command('topic-update <name>', 'Update a topic')
  .command('topic-info <name>', 'Get info for a topic')
  .parse(process.argv);
