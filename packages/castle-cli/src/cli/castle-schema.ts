import * as program from 'commander';

program
  .version('0.1.0')
  .name('castle schema')
  .description('Subcommands for getting schema versions of kafka topics.')
  .command('show', 'show all versions of a given schema')
  .command('search', 'search for schemas in the schema registry')
  .parse(process.argv);
