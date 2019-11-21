import * as command from 'commander';
import { configCommand } from './commands/config';

configCommand(command).parse(process.argv);
