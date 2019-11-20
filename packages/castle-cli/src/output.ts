import * as chalk from 'chalk';
import ansiRegex = require('ansi-regex');

export enum Output {
  JSON,
  CLI,
}

export const ansiLength = (text: string): number => text.replace(ansiRegex(), '').length;

export const devider = (text = '', char = '-', size = 100): string =>
  chalk.yellow(text.padEnd(size, char));

export const highlight = (text: string, highlight: string): string =>
  text.replace(highlight, chalk.yellow(highlight));

export const table = (rows: string[][]): string => {
  const columns = rows[0].map((_, index) => rows.map(row => row[index]));
  const columnLengths = columns.map(column =>
    column.reduce((len, item) => Math.max(len, ansiLength(item)), 0),
  );

  return rows
    .map(row =>
      row
        .map((item, index) => item + ' '.repeat(columnLengths[index] - ansiLength(item)))
        .join(chalk.gray(' | ')),
    )
    .join('\n');
};

export const createOutput = (type: Output) => ({
  log: (line: string): void => {
    if (type === Output.CLI) {
      console.log(line);
    }
  },
  error: (line: string): void => {
    console.error(chalk.red(line));
  },
  success: (line: string): void => {
    if (type === Output.CLI) {
      console.log(chalk.green(line));
    }
  },
  json: (object: any): void => {
    if (type === Output.JSON) {
      console.log(JSON.stringify(object, null, 2));
    }
  },
});
