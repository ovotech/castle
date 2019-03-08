import { avroTs } from '@ovotech/avro-ts';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { Arguments, CommandModule } from 'yargs';

export interface ConvertTags {
  input: string[];
  ['output-dir']: string;
  ['logical-type']: string[];
}

export const convertCommand: CommandModule<{}, ConvertTags> = {
  command: 'convert [input..]',
  builder: {
    input: {
      description: 'Directory to read avsc files from',
      default: '.',
    },
    ['output-dir']: {
      description: 'Directory to write typescript files to',
      default: '',
    },
    ['logical-type']: {
      description: 'Logical types, ex. date=string',
      type: 'array',
      default: [],
    },
  },
  describe: 'Convert avsc to typescript files',
  handler: async args => {
    const logicalTypes = args['logical-type'].reduce(
      (types, logicalType) => {
        const [name, type] = logicalType.split('=');
        return { [name]: type, ...types };
      },
      {} as {},
    );

    for (const file of args.input) {
      const avroSchema = JSON.parse(String(readFileSync(file)));
      const ts = avroTs(avroSchema, logicalTypes);
      const outputFile = args['output-dir'] ? join(args['output-dir'], `${basename(file)}.ts`) : `${file}.ts`;
      writeFileSync(outputFile, ts);

      const shortFile = file.replace(process.cwd(), '.');
      const shortOutputFile = outputFile.replace(process.cwd(), '.');
      process.stdout.write(chalk`Converted file {green ${shortFile}} -> {yellow ${shortOutputFile}}\n`);
    }

    process.stdout.write(chalk`{green Finished.}\n`);
  },
};
