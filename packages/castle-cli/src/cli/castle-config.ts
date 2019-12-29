import * as program from 'commander';

program
  .version('0.1.0')
  .name('castle config')
  .description(
    'Subcommands to create / edit connection configs to kafka brokers and schema registers, that can be used by other commands.',
  )
  .command('set', 'create or update a config file')
  .command('remove', 'remove a config from the default config folder')
  .command('search', 'search for configs in default config folder')
  .parse(process.argv);
