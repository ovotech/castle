import * as command from 'commander';
import { castleConfigSet } from '../commands/config/set';

castleConfigSet(command).parse(process.argv);
