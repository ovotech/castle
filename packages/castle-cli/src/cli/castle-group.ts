import * as program from 'commander';

program
  .version('0.1.0')
  .command('show', 'show details of a consumer group for a topic')
  .command('update', 'update offsets for a consumer group for a topic')
  .parse(process.argv);
