import * as command from 'commander';
import { topicUpdateCommand } from './commands/topic-update';

topicUpdateCommand(command).parse(process.argv);
