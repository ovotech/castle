import { Command } from 'commander';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
import { inspect } from 'util';
import { loadConfigFile } from '../config';
import { devider, header, Output } from '../output';

interface Options {
  config?: string;
  json?: boolean;
  depth?: number;
}

export const schemaCommand = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle schema')
    .arguments('<name>')
    .description(
      `Avro schema information of topic.
Search for schemas with the given name, if only one schema is found, return the full schema history for that topic.

Examples:
  castle schema my-to
  castle schema my-topic --depth 7
  castle schema my-topic --json
`,
    )
    .option('-D, --depth <depth>', 'depth for the schemas output', val => parseInt(val), 5)
    .option('-J, --json', 'output as json')
    .option('-C, --config <configFile>', 'config file with connection deails')
    .action(async (name, { depth, json, config: configFile }: Options) => {
      await output.wrap(json, async () => {
        const config = await loadConfigFile(configFile);
        const schemaRegistry = new SchemaRegistry(config.schemaRegistry);

        output.log(header('Avro Schema', name, config));

        const subjects = await schemaRegistry.getSubjects();
        const filtered = subjects.filter(subject => subject.includes(name));

        if (filtered.length === 0) {
          output.json([]);
          output.error('No schemas found');
        } else if (filtered.length === 1) {
          const versions = await schemaRegistry.getSubjectVersions(subjects[0]);
          const versionSchemas = await Promise.all(
            versions.map(version => schemaRegistry.getSubjectVersionSchema(subjects[0], version)),
          );
          output.json(JSON.stringify(versionSchemas, null, 2));
          output.log(`Subject "${subjects[0]}" found ${versions.length} versions`);
          for (const index in versionSchemas) {
            output.log(devider(`Version ${index + 1}`));
            output.log(inspect(versionSchemas[index], { colors: true, depth }));
          }
        } else {
          output.json([]);
          output.log(`Found 7 matching "${name}"`);
          output.log(devider());
          output.log(subjects.join('\n'));
        }
      });
    });
