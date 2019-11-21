import * as command from 'commander';
import { produceCommand } from './commands/produce';

produceCommand(command).parse(process.argv);
