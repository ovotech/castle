import * as command from 'commander';
import { SchemaRegistry } from '@ovotech/avro-kafkajs';
import { inspect } from 'util';
import { loadConfigFile } from './config';
import { parse } from 'url';
import { createOutput, Output, devider } from './output';

interface Options {
  config?: string;
  json?: boolean;
  depth?: number;
}

command
  .description('Inspect the schema of a topic')
  .option('-D, --depth <depth>', 'Depth for the schemas output', val => parseInt(val), 5)
  .option('-J, --json', 'Output as json')
  .option('-C, --config <configFile>', 'Config file with connection deails')
  .action(async (name, { depth, json, config: configFile }: Options) => {
    const config = await loadConfigFile(configFile);
    const schemaRegistry = new SchemaRegistry(config.schemaRegistry);
    const output = createOutput(json ? Output.JSON : Output.CLI);
    const { host, port } = parse(config.schemaRegistry.uri);

    output.log(`Searching for schema "${name}" in schema registry ${host}:${port}`);

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
  })
  .parse(process.argv);
