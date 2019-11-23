import * as command from 'commander';
import { castleTopicShow } from '../commands/topic/show';

castleTopicShow(command).parse(process.argv);
