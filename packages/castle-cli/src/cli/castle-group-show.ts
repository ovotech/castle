import * as command from 'commander';
import { castleGroupShow } from '../commands/group/show';

castleGroupShow(command).parse(process.argv);
