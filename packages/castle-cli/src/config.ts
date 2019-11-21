import { existsSync, readFileSync } from 'fs';
import { Schema as JSONSchema, ensureValid } from '@ovotech/json-schema';
import { SchemaRegistryConfig } from '@ovotech/avro-kafkajs';
import { KafkaConfig, logLevel } from 'kafkajs';
import { join } from 'path';
import { homedir } from 'os';

const configSchema: JSONSchema = {
  type: 'object',
  properties: {
    schemaRegistry: {
      type: 'object',
      required: ['uri'],
      properties: {
        uri: { type: 'string', format: 'uri' },
      },
    },
    kafka: {
      type: 'object',
      required: ['brokers'],
      properties: {
        brokers: { items: { type: 'string' } },
        ssl: {
          properties: {
            key: { type: 'string' },
            passphrase: { type: 'string' },
            cert: { type: 'string' },
            ca: { type: 'string' },
          },
        },
        clientId: { type: 'string' },
        connectionTimeout: { type: 'number' },
        authenticationTimeout: { type: 'number' },
        reauthenticationThreshold: { type: 'number' },
        requestTimeout: { type: 'number' },
        enforceRequestTimeout: { type: 'boolean' },
        retry: {
          properties: {
            maxRetryTime: { type: 'number' },
            initialRetryTime: { type: 'number' },
            factor: { type: 'number' },
            multiplier: { type: 'number' },
            retries: { type: 'number' },
          },
        },
      },
    },
  },
};

export interface Config {
  schemaRegistry: SchemaRegistryConfig;
  kafka: KafkaConfig;
}

export const defaults: Config = {
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logLevel: logLevel.ERROR },
};

export const loadConfigFile = async (file?: string): Promise<Config> => {
  if (!file) {
    return defaults;
  }

  const locations = [file, join('.castle-cli', file), join(homedir(), '.castle-cli', file)];
  const location = locations.find(location => existsSync(location));

  if (!location) {
    throw new Error(
      `Configuration file "${file}" not found in current directory, .castle-cli or ~/.castle-cli`,
    );
  }

  return await ensureValid<Config>(configSchema, JSON.parse(readFileSync(location, 'utf8')), {
    name: 'ConfigFile',
  });
};
