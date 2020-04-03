import * as commander from 'commander';
import { toTypeScript } from '@ovotech/avro-ts';
import { join, basename } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import * as chalk from 'chalk';
import { table } from './output';
import { inspect } from 'util';

interface Options {
  logicalType?: { [key: string]: string };
  logicalTypeImport?: { [key: string]: { named: string; module: string } };
  logicalTypeImportAll?: { [key: string]: { allAs: string; module: string } };
  logicalTypeImportDefault?: { [key: string]: { defaultAs: string; module: string } };
  outputDir?: string;
}

export const convert = (logger: { log: (msg: string) => void } = console): commander.Command =>
  commander
    .createCommand('avro-ts')
    .arguments('[input...]')
    .option('-O, --output-dir <outputDir>', 'Directory to write typescript files to')
    .option(
      '--logical-type <logicalType>',
      'Logical type, example: date=string',
      (curr: string, prev: Options['logicalType']) => {
        const [logicalType, type] = curr.split('=');
        return { ...prev, [logicalType]: type };
      },
      {},
    )
    .option(
      '--logical-type-import <logicalType>',
      'Logical type import custom module, example: date=Decimal:decimal.js',
      (curr: string, prev: Options['logicalTypeImport']) => {
        const [logicalType, typeString] = curr.split('=');
        const [name, module] = typeString.split(':');
        return { ...prev, [logicalType]: { named: name, module } };
      },
      {},
    )
    .option(
      '--logical-type-import-all <logicalType>',
      'Logical type import custom module as *, example: date=Decimal:decimal.js',
      (curr: string, prev: Options['logicalTypeImportAll']) => {
        const [logicalType, typeString] = curr.split('=');
        const [name, module] = typeString.split(':');
        return { ...prev, [logicalType]: { allAs: name, module } };
      },
      {},
    )
    .option(
      '--logical-type-import-default <logicalType>',
      'Logical type import custom module as default, example: date=Decimal:decimal.js',
      (curr: string, prev: Options['logicalTypeImportDefault']) => {
        const [logicalType, typeString] = curr.split('=');
        const [name, module] = typeString.split(':');
        return { ...prev, [logicalType]: { defaultAs: name, module } };
      },
      {},
    )
    .description(
      `Convert avsc to typescript files.

You can pass a logical types to be included into the generated file with the --logical-type option.
A custom library can be used with --logical-type-import {name}={class to import}:{package name}.
The --logical-type-import-default and --logical-type-import-all would import the class as default and as synthetic default respectively.

Example:
  avro-ts avro-schema.avsc
  avro-ts avro/*.avsc
  avro-ts avro/*.avsc --output-dir other/dir
  avro-ts avro/*.avsc --logical-type date=string --logical-type datetime=string
  avro-ts avro/*.avsc --logical-type-import decimal=Decimal:decimal.js
  avro-ts avro/*.avsc --logical-type-import-default decimal=Decimal:decimal.js
  avro-ts avro/*.avsc --logical-type-import-all decimal=Decimal:decimal.js
  `,
    )
    .action(
      (
        input: string[],
        {
          logicalType,
          logicalTypeImport,
          logicalTypeImportAll,
          logicalTypeImportDefault,
          outputDir,
        }: Options,
      ) => {
        if (input.length === 0) {
          logger.log(chalk.red('No files specified to convert'));
        } else {
          logger.log('Converting Avro to TypeScript');
          logger.log('');
          const logicalTypes = {
            ...logicalType,
            ...logicalTypeImport,
            ...logicalTypeImportAll,
            ...logicalTypeImportDefault,
          };
          if (logicalTypes && Object.keys(logicalTypes).length) {
            logger.log(
              table([
                ['Logical Type', 'TypeScript Type'],
                ...Object.entries(logicalTypes).map(([logical, tsType]) => [
                  logical,
                  typeof tsType === 'string' ? tsType : inspect(tsType, { colors: true }),
                ]),
              ]),
            );
            logger.log('');
          }
          const result = input.map((file) => {
            const avroSchema = JSON.parse(String(readFileSync(file)));
            const ts = toTypeScript(avroSchema, { logicalTypes });
            const outputFile = outputDir ? join(outputDir, `${basename(file)}.ts`) : `${file}.ts`;
            writeFileSync(outputFile, ts);
            const shortFile = file.replace(process.cwd(), '.');
            const shortOutputFile = outputFile.replace(process.cwd(), '.');
            return [chalk.green(shortFile), chalk.yellow(shortOutputFile)];
          });
          logger.log(table([['Avro Schema', 'TypeScript File'], ...result]));
        }
      },
    );
