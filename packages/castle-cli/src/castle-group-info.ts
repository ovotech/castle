import * as command from 'commander';
import { groupInfoCommand } from './commands/group-info';

groupInfoCommand(command).parse(process.argv);
