import * as command from 'commander';
import { castleTopicCreate } from '../commands/topic/create';

castleTopicCreate(command).parse(process.argv);
