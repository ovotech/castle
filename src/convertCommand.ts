import { avroTs } from '@ovotech/avro-ts';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { Arguments, CommandModule } from 'yargs';

export interface ConvertTags {
  input: string[];
  ['output-dir']: string;
  ['logical-type']: string[];
  ['logical-type-import']: string[];
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
    ['logical-type-import']: {
      description: "Logical types import, ex. Decimal=import {Decimal} from 'my-lib'",
      type: 'array',
      default: [],
    },
  },
  describe: 'Convert avsc to typescript files',
  handler: async args => {
    // @ts-ignore arg.split('=') returns [string, string], although we don't runtime-check that
    const rawLogicalTypes: Array<string, string> = objectFromEntries(args['logical-type'].map(arg => arg.split('=')));
    // @ts-ignore not sure why TS doesn't li
    const logicalTypeImports = objectFromEntries(args['logical-type-import'].map(arg => arg.split('=')));

    for (const file of args.input) {
      const avroSchema = JSON.parse(String(readFileSync(file)));
      const ts = avroTs(avroSchema, mergeTypesAndImport(rawLogicalTypes, logicalTypeImports));
      const outputFile = args['output-dir'] ? join(args['output-dir'], `${basename(file)}.ts`) : `${file}.ts`;
      writeFileSync(outputFile, ts);

      const shortFile = file.replace(process.cwd(), '.');
      const shortOutputFile = outputFile.replace(process.cwd(), '.');
      process.stdout.write(chalk`Converted file {green ${shortFile}} -> {yellow ${shortOutputFile}}\n`);
    }

    process.stdout.write(chalk`{green Finished.}\n`);
  },
};

type StringObject = {
  [key: string]: string;
};

function mergeTypesAndImport(types: StringObject, imports: StringObject) {
  return Object.entries(types).reduce(
    (all, [name, type]) => Object.assign(all, { [name]: imports[name] ? { type, import: imports[name] } : type }),
    {},
  );
}

// ES2019 Object.fromEntries() cannot arrive fast enough
function objectFromEntries(entries: Array<[string, string]>) {
  return entries.reduce((all, [key, value]) => Object.assign(all, { [key]: value }), {});
}
