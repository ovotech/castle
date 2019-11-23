import * as command from 'commander';
import { castleGroupUpdate } from '../commands/group/update';

castleGroupUpdate(command).parse(process.argv);
