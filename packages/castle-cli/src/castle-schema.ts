import * as command from 'commander';
import { schemaCommand } from './commands/schema';

schemaCommand(command).parse(process.argv);
