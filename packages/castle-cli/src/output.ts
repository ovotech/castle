import * as chalk from 'chalk';
import * as ansiRegex from 'ansi-regex';
import { Config } from './config';
import { parse, format } from 'url';
import { logLevel } from 'kafkajs';

export enum OutputType {
  JSON,
  CLI,
}

export const ansiLength = (text: string): number => text.replace(ansiRegex(), '').length;

export const devider = (text = '', char = '-', size = 100): string =>
  chalk.yellow(text.padEnd(size, char));

export const connection = (config: Config): string => {
  const { host, port, auth, protocol, pathname } = parse(config.schemaRegistry.uri);
  const schemaRegistry = format({ host, port, auth: auth ? '***' : undefined, protocol, pathname });
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

export const logLine = (level: logLevel, log: { message: string; broker?: string }): string => {
  switch (level) {
    case logLevel.ERROR:
      return `ERR: ${log.message}`;
    case logLevel.WARN:
      return `${chalk.yellow('WRN')}: ${log.message} `;
    case logLevel.INFO:
      return `${chalk.blueBright('INF')}: ${log.message} `;
    case logLevel.DEBUG:
      return `DBG: ${log.broker} ${log.message} `;
    default:
      return '';
  }
};

export const highlight = (text: string, highlight: string): string =>
  text.replace(highlight, chalk.yellow(highlight));

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

export interface Logger {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  log: (...args: any[]) => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  error: (...args: any[]) => void;
}

export class Output {
  public type: OutputType = OutputType.CLI;
  public exit = true;
  private logger: Logger;

  public constructor(logger: Logger, exit = true) {
    this.logger = logger || console;
    this.exit = exit;
  }

  public log(line: string): void {
    if (this.type === OutputType.CLI) {
      this.logger.log(line);
    }
  }

  public error(line: string, code?: number): void {
    this.logger.error(chalk.red(line));
    if (this.exit && code !== undefined) {
      process.exitCode = 1;
    }
  }

  public async wrap(json: boolean | undefined, action: () => Promise<void>): Promise<void> {
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

  public success(line: string): void {
    if (this.type === OutputType.CLI) {
      this.logger.log(chalk.green(line));
    }
  }

  public json(object: unknown): void {
    if (this.type === OutputType.JSON) {
      this.logger.log(JSON.stringify(object, null, 2));
    }
  }
}
