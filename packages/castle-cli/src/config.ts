import { existsSync, readFileSync } from 'fs';
import { logLevel } from 'kafkajs';
import { join } from 'path';
import { homedir } from 'os';
import { Record, Partial, String, Array, Number, Static, Union, Literal, Boolean } from 'runtypes';

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
      ssl: Partial({
        key: String,
        cert: String,
        ca: String,
        passphrase: String,
      }),
      sasl: Record({
        mechanism: Union(
          Literal('plain'),
          Literal('scram-sha-256'),
          Literal('scram-sha-512'),
          Literal('aws'),
        ),
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
  kafka: { brokers: ['localhost:29092'], logLevel: logLevel.ERROR },
};

export const configsDir = join(homedir(), '.castle-cli');

export const loadConfigFile = async (file?: string): Promise<Config> => {
  if (!file) {
    return defaults;
  }

  const locations = [file, join('.castle-cli', file), join(configsDir, file)];
  const location = locations.find(location => existsSync(location));

  if (!location) {
    throw new Error(
      `Configuration file "${file}" not found in current directory, .castle-cli or ~/.castle-cli`,
    );
  }

  const result = ConfigType.validate(JSON.parse(readFileSync(location, 'utf8')));
  if (result.success !== true) {
    throw new Error(`Invalid config file (${location}). ${result.key}: ${result.message}`);
  }
  return result.value;
};
