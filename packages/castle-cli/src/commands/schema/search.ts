import * as commander from 'commander';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
import { loadConfigFile } from '../../config';
import { header, Output, highlight } from '../../output';

interface Options {
  config?: string;
  json?: boolean;
}

export const castleSchemaSearch = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('search')
    .arguments('[name]')
    .description(
      `Search for schemas with the given name in the schema registry. If you don't specify a search string returns all of them.

Examples:
  castle schema search
  castle schema search my-to
  castle schema search my-topic --json
`,
    )
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (name, { json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile({ file: configFile });
        const schemaRegistry = new SchemaRegistry(config.schemaRegistry);

        output.log(header('Searching for schemas', name ? name : '<all>', config));

        const subjects = await schemaRegistry.getSubjects();
        const filtered = subjects.filter((subject) => (name ? subject.includes(name) : true));
        output.json(filtered);

        if (filtered.length === 0) {
          output.error('No schemas found');
        } else {
          for (const subject of filtered) {
            output.log(highlight(subject, name));
          }
        }
      });
    });
