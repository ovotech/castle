import * as command from 'commander';
import { castleTopicUpdate } from '../commands/topic/update';

castleTopicUpdate(command).parse(process.argv);
