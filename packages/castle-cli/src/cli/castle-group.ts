import * as program from 'commander';

program
  .version('0.1.0')
  .name('castle group')
  .description('Subcommands to manipulate consumer group offsets.')
  .command('show', 'show details of a consumer group for a topic')
  .command('update', 'update offsets for a consumer group for a topic')
  .parse(process.argv);
