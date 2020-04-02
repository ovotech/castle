import * as commander from 'commander';
import { castleGroupShow } from './show';
import { castleGroupUpdate } from './update';
import { Output } from '../../output';

export const castleGroup = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('group')
    .description('Subcommands to manipulate consumer group offsets.')
    .addCommand(castleGroupShow(output))
    .addCommand(castleGroupUpdate(output));

// .command('show', 'show details of a consumer group for a topic')
// .command('update', 'update offsets for a consumer group for a topic')
