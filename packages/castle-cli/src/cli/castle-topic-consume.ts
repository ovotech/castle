import * as command from 'commander';
import { castleTopicConsume } from '../commands/topic/consume';

castleTopicConsume(command).parse(process.argv);
