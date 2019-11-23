import * as command from 'commander';
import { castleConfigSearch } from '../commands/config/search';

castleConfigSearch(command).parse(process.argv);
