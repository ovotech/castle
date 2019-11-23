import * as command from 'commander';
import { castleTopicProduce } from '../commands/topic/produce';

castleTopicProduce(command).parse(process.argv);
