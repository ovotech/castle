import * as ansiRegex from 'ansi-regex';
import * as chalk from 'chalk';

export const ansiLength = (text: string): number => text.replace(ansiRegex(), '').length;

export const table = (rows: string[][]): string => {
  const columns = rows[0].map((_, index) => rows.map((row) => row[index]));
  const columnLengths = columns.map((column) =>
    column.reduce((len, item) => Math.max(len, ansiLength(item)), 0),
  );

  return rows
    .map((row) =>
      row
        .map((item, index) => item + ' '.repeat(columnLengths[index] - ansiLength(item)))
        .join(chalk.gray(' | ')),
    )
    .join('\n');
};
