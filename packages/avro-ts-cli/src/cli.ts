import chalk from 'chalk';
import * as yargs from 'yargs';
import { convertCommand } from '.';

const argv = yargs
  .command(convertCommand)
  .epilog('copyright OVO Energy 2019')
  .demandCommand()
  .fail((msg, err) => {
    process.stderr.write(chalk`{red Error: ${msg || err.message}}\n`);
    process.exit(1);
  })
  .help().argv;
