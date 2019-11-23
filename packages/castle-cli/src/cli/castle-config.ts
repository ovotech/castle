import * as program from 'commander';

program
  .version('0.1.0')
  .description('Manipulate connection configs')
  .command('set', 'create or update a config file')
  .command('remove', 'remove a config from the default config folder')
  .command('search', 'search for configs in default config folder')
  .parse(process.argv);
