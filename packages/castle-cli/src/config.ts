import { existsSync, readFileSync } from 'fs';
import { logLevel, logCreator } from 'kafkajs';
import { join } from 'path';
import { homedir } from 'os';
import {
  Record,
  Partial,
  String,
  Array,
  Number,
  Static,
  Union,
  Literal,
  Boolean,
  Function,
} from 'runtypes';
import { Output, logLine } from './output';

export type SASLMechanism = 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'aws';

export interface SASLOptions {
  mechanism: SASLMechanism;
  username: string;
  password: string;
}

export const ConfigType = Record({
  schemaRegistry: Record({
    uri: String,
  }),
  kafka: Record({ brokers: Array(String) }).And(
    Partial({
      logLevel: Union(Literal(0), Literal(1), Literal(2), Literal(4), Literal(5)),
      logCreator: Function,
      ssl: Partial({
        key: String,
        cert: String,
        ca: String,
        passphrase: String,
      }),
      sasl: Record({
        mechanism: Union(Literal('scram-sha-512')),
        username: String,
        password: String,
      }),
      clientId: String,
      connectionTimeout: Number,
      authenticationTimeout: Number,
      reauthenticationThreshold: Number,
      requestTimeout: Number,
      enforceRequestTimeout: Boolean,
      retry: Partial({
        maxRetryTime: Number,
        initialRetryTime: Number,
        factor: Number,
        multiplier: Number,
        retries: Number,
      }),
    }),
  ),
});

export type Config = Static<typeof ConfigType>;

export const defaults = {
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'] },
};
const logLevels = [logLevel.NOTHING, logLevel.ERROR, logLevel.WARN, logLevel.INFO, logLevel.DEBUG];

export const configsDir = join(homedir(), '.castle-cli');

const logLevelOption = (verbose?: 1 | 2 | 3 | 4): logLevel => logLevels[verbose ?? 0];

const logCreatorOption = (output: Output = new Output(console)): logCreator => {
  return () => {
    return (entry) => {
      if (entry.level === logLevel.ERROR) {
        output.error(logLine(entry.level, entry.log));
      } else {
        output.log(logLine(entry.level, entry.log));
      }
    };
  };
};

const toLoggerConfig = (config: Config, verbose?: 1 | 2 | 3 | 4, output?: Output): Config => ({
  ...config,
  kafka: {
    ...config.kafka,
    logLevel: logLevelOption(verbose),
    logCreator: logCreatorOption(output),
  },
});

export interface LoadConfigFileOptions {
  output?: Output;
  file?: string;
  verbose?: 1 | 2 | 3 | 4;
}

export const loadConfigFile = async ({
  file,
  verbose,
  output,
}: LoadConfigFileOptions = {}): Promise<Config> => {
  if (!file) {
    return toLoggerConfig(defaults, verbose, output);
  }

  const locations = [file, join('.castle-cli', file), join(configsDir, file)];
  const location = locations.find((location) => existsSync(location));

  if (!location) {
    throw new Error(
      `Configuration file "${file}" not found in current directory, .castle-cli or ~/.castle-cli`,
    );
  }

  const result = ConfigType.validate(JSON.parse(readFileSync(location, 'utf8')));
  if (result.success !== true) {
    throw new Error(`Invalid config file (${location}). ${result.key}: ${result.message}`);
  }
  return toLoggerConfig(result.value, verbose, output);
};
