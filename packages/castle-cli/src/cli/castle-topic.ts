import * as program from 'commander';

program
  .version('0.1.0')
  .name('castle topic')
  .description(
    'Subcommands for searching and manipulating kafka topics, as well as producing and consuming events from them.',
  )
  .command('show', 'show details of a topic')
  .command('update', 'update config entries of a topic')
  .command('search', 'search for topics')
  .command('create', 'create a topic')
  .command('consume', 'consume messages of a topic')
  .command('produce', 'produce messages for a topic')
  .command('message', 'produce a single ad-hoc message for a topic')
  .parse(process.argv);
