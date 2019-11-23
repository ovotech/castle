import * as command from 'commander';
import { castleSchemaSearch } from '../commands/schema/search';

castleSchemaSearch(command).parse(process.argv);
