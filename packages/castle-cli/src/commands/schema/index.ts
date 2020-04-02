import * as commander from 'commander';
import { castleSchemaShow } from './show';
import { castleSchemaSearch } from './search';
import { Output } from '../../output';

export const castleSchema = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('schema')
    .description('Subcommands for getting schema versions of kafka topics.')
    .addCommand(castleSchemaShow(output))
    .addCommand(castleSchemaSearch(output));
