import * as command from 'commander';
import { groupUpdateCommand } from './commands/group-update';

groupUpdateCommand(command).parse(process.argv);
