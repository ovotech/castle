import * as command from 'commander';
import { castleSchemaShow } from '../commands/schema/show';

castleSchemaShow(command).parse(process.argv);
