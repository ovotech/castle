import * as chalk from 'chalk';
import * as ansiRegex from 'ansi-regex';
import { Config } from './config';
import { parse, format } from 'url';

export enum OutputType {
  JSON,
  CLI,
}

export const ansiLength = (text: string): number => text.replace(ansiRegex(), '').length;

export const devider = (text = '', char = '-', size = 100): string =>
  chalk.yellow(text.padEnd(size, char));

export const connection = (config: Config): string => {
  const { host, port, auth, protocol, path } = parse(config.schemaRegistry.uri);
  const schemaRegistry = format({ host, port, auth: auth ? '***' : undefined, protocol, path });
  const modifiers = [
    ...(config.kafka.ssl ? ['(TLS)'] : []),
    ...(config.kafka.sasl ? ['(SASL)'] : []),
  ];

  const kafka = `${config.kafka.brokers.join(', ')} ${modifiers.join(', ')}`;
  return `Kafka: ${kafka} SchemaRegistry: ${schemaRegistry}`;
};

export const header = (prefix: string, title: string, config?: Config): string => {
  return (
    `${prefix} "${chalk.yellow(title)}"\n` + (config ? chalk.gray(connection(config)) + '\n' : '')
  );
};

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

export interface Logger {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

export class Output {
  public type: OutputType = OutputType.CLI;
  public exit = true;
  private logger: Logger;

  constructor(logger: Logger, exit = true) {
    this.logger = logger || console;
    this.exit = exit;
  }

  log(line: string): void {
    if (this.type === OutputType.CLI) {
      this.logger.log(line);
    }
  }

  error(line: string, code?: number): void {
    this.logger.error(chalk.red(line));
    if (this.exit && code !== undefined) {
      process.exitCode = 1;
    }
  }

  async wrap(json: boolean | undefined, action: () => Promise<void>): Promise<void> {
    this.type = json ? OutputType.JSON : OutputType.CLI;

    try {
      await action();
    } catch (error) {
      this.logger.error(chalk.red(error.message));
      if (this.exit) {
        process.exit(1);
      }
    }
  }

  success(line: string): void {
    if (this.type === OutputType.CLI) {
      this.logger.log(chalk.green(line));
    }
  }

  json(object: unknown): void {
    if (this.type === OutputType.JSON) {
      this.logger.log(JSON.stringify(object, null, 2));
    }
  }
}
