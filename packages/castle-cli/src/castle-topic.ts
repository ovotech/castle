import * as command from 'commander';
import { topicCommand } from './commands/topic';

topicCommand(command).parse(process.argv);
