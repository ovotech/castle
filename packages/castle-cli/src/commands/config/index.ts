import * as commander from 'commander';
import { Output } from '../../output';
import { castleConfigSet } from './set';
import { castleConfigRemove } from './remove';
import { castleConfigSearch } from './search';

export const castleConfig = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('config')
    .description(
      'Subcommands to create / edit connection configs to kafka brokers and schema registers, that can be used by other commands.',
    )
    .addCommand(castleConfigSet(output))
    .addCommand(castleConfigRemove(output))
    .addCommand(castleConfigSearch(output));

// .command('set', 'create or update a config file')
// .command('remove', 'remove a config from the default config folder')
// .command('search', 'search for configs in default config folder')
