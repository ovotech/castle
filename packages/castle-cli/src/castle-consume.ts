import * as command from 'commander';
import { consumeCommand } from './commands/consume';

consumeCommand(command).parse(process.argv);
