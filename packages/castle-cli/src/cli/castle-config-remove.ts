import * as command from 'commander';
import { castleConfigRemove } from '../commands/config/remove';

castleConfigRemove(command).parse(process.argv);
