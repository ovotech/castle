import * as command from 'commander';
import { castleTopicSearch } from '../commands/topic/search';

castleTopicSearch(command).parse(process.argv);
