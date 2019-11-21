import * as command from 'commander';
import { topicCreateCommand } from './commands/topic-create';

topicCreateCommand(command).parse(process.argv);
