import * as commander from 'commander';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
import { inspect } from 'util';
import { loadConfigFile } from '../../config';
import { devider, header, Output } from '../../output';

interface Options {
  config?: string;
  json?: boolean;
  depth?: number;
}

export const castleSchemaShow = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('show')
    .arguments('<name>')
    .description(
      `Show all the versions of a schema in the schema registry.

Examples:
  castle schema show my-topic --depth 7
  castle schema show my-topic --json
`,
    )
    .option('-D, --depth <depth>', 'depth for the schemas output', (val) => parseInt(val), 5)
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (name, { depth, json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile({ file: configFile });
        const schemaRegistry = new SchemaRegistry(config.schemaRegistry);

        output.log(header('Showing schema', name, config));

        const versions = await schemaRegistry.getSubjectVersions(name);
        const versionSchemas = await Promise.all(
          versions.map((version) => schemaRegistry.getSubjectVersionSchema(name, version)),
        );
        output.json(versionSchemas);
        output.log(`Found ${versions.length} versions`);
        for (const index in versionSchemas) {
          output.log(devider(`Version ${index + 1} `));
          output.log(inspect(versionSchemas[index], { colors: true, depth }));
        }
      });
    });
