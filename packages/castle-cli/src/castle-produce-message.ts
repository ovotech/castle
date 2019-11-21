import * as command from 'commander';
import { produceMessageCommand } from './commands/produce-message';

produceMessageCommand(command).parse(process.argv);
