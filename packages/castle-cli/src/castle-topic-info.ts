import * as command from 'commander';
import { topicInfoCommand } from './commands/topic-info';

topicInfoCommand(command).parse(process.argv);
