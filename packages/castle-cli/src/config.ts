import { existsSync, readFileSync } from 'fs';
import { Schema as JSONSchema, ensureValid } from '@ovotech/json-schema';
import { SchemaRegistryConfig } from '@ovotech/avro-kafkajs';
import { KafkaConfig, logLevel } from 'kafkajs';

const configSchema: JSONSchema = {
  properties: {
    schemaRegistry: {
      required: ['uri'],
      properties: {
        uri: { type: 'string', format: 'uri' },
      },
    },
    kafka: {
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

interface Config {
  schemaRegistry: SchemaRegistryConfig;
  kafka: KafkaConfig;
}

const defaults: Config = {
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logLevel: logLevel.ERROR },
};

export const loadConfigFile = async (file?: string): Promise<Config> => {
  if (!file && existsSync('castle.config.json')) {
    return loadConfigFile('castle.config.json');
  }

  if (!file) {
    return defaults;
  }

  if (!existsSync(file)) {
    throw new Error(`Configuration file "${file}" not found.`);
  }

  return await ensureValid<Config>(configSchema, JSON.parse(readFileSync(file, 'utf8')), {
    name: 'ConfigFile',
  });
};
