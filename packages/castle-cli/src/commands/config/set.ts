import { Command } from 'commander';
import { Config, defaults } from '../../config';
import { header, Output, OutputType } from '../../output';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { configsDir } from '../../config';

interface Options {
  kafkaBroker: string[];
  key?: string;
  cert?: string;
  ca?: string;
  schemaRegistry?: string;
  json?: boolean;
}

export const castleConfigSet = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle config set')
    .arguments('<name>')

    .description(
      `Create a new configuration file or update an existing one in the default config directory (${configsDir}).

Example:
  castle config set uat --kafka-broker localhost:3203 --schema-registry http://localhost:8081
  castle config set uat --kafka-broker localhost:3203 --key private.pem --ca ca.pem --cert cert.pem --schema-registry http://localhost:8081`,
    )
    .option(
      '-B, --kafka-broker <host>',
      'Kafka broker host, can be multiple',
      (curr: string, prev: string[]) => prev.concat(curr),
      [],
    )
    .option('-K, --key <keyFile>', 'tls Key file (BEGIN PRIVATE KEY)')
    .option('-C, --cert <certFile>', 'tls Certificate file (BEGIN CERTIFICATE)')
    .option('-A, --ca <certFile>', 'tls Certificate Authority file (BEGIN CERTIFICATE)')
    .option('-S, --schema-registry <uri>', 'schema Registry URI (including auth)')
    .option('-J, --json', 'output as json, instead of saving to config directory')
    .action(async (name, { kafkaBroker, key, cert, ca, schemaRegistry, json }: Options) => {
      await output.wrap(json, async () => {
        if (!existsSync(configsDir)) {
          mkdirSync(configsDir);
        }

        const file = join(configsDir, name);
        const config: Config = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : defaults;

        if (kafkaBroker.length) {
          config.kafka.brokers = kafkaBroker;
        }

        if (schemaRegistry) {
          config.schemaRegistry.uri = schemaRegistry;
        }

        if (key) {
          config.kafka.ssl = { ...(config.kafka.ssl || {}), key: readFileSync(key, 'utf8') };
        }

        if (ca) {
          config.kafka.ssl = { ...(config.kafka.ssl || {}), ca: readFileSync(ca, 'utf8') };
        }

        if (cert) {
          config.kafka.ssl = { ...(config.kafka.ssl || {}), cert: readFileSync(cert, 'utf8') };
        }

        output.log(header('Setting config', name, config));
        output.json(config);
        if (output.type !== OutputType.JSON) {
          writeFileSync(file, JSON.stringify(config), 'utf8');
        }
        output.success('Success');
      });
    });
