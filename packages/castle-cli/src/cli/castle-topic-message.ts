import * as command from 'commander';
import { castleTopicMessage } from '../commands/topic/message';

castleTopicMessage(command).parse(process.argv);
