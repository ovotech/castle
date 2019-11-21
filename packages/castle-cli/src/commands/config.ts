import { Command } from 'commander';
import { Config, defaults } from '../config';
import { header, Output } from '../output';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, mkdirSync } from 'fs';
import { homedir } from 'os';

interface Options {
  kafkaBroker: string[];
  key?: string;
  cert?: string;
  ca?: string;
  schemaRegistry?: string;
  remove?: boolean;
}

export const configCommand = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle config')
    .arguments('[name]')

    .description(
      `Set / View a configuration file.

Example:
  castle config
  castle config uat
  castle config uat --kafka-broker localhost:3203 --schema-registry http://localhost:8081
  castle config uat --kafka-broker localhost:3203 --key private.pem --ca ca.pem --cert cert.pem --schema-registry http://localhost:8081
  castle config uat --remove`,
    )
    .option(
      '-B, --kafka-broker <host>',
      'Kafka broker host, can be multiple',
      (curr: string, prev: string[]) => prev.concat(curr),
      [],
    )
    .option('-K, --key <keyFile>', 'TLS Key file (BEGIN PRIVATE KEY)')
    .option('-C, --cert <certFile>', 'TLS Certificate file (BEGIN CERTIFICATE)')
    .option('-A, --ca <certFile>', 'TLS Certificate Authority file (BEGIN CERTIFICATE)')
    .option('-S, --schema-registry <uri>', 'Schema Registry URI (including auth)')
    .option('-R, --remove', 'Remove a configuration')
    .action(async (name, { kafkaBroker, key, cert, ca, schemaRegistry, remove }: Options) => {
      await output.wrap(false, async () => {
        const configsDir = join(homedir(), '.castle-cli');
        if (!existsSync(configsDir)) {
          mkdirSync(configsDir);
        }

        if (!name) {
          const configs = readdirSync(configsDir);
          output.log(header('Configs', configsDir));
          if (configs.length > 0) {
            output.log(configs.join('\n'));
          } else {
            output.error('No configs found');
          }
        } else if (kafkaBroker.length || schemaRegistry || key || cert || ca) {
          const file = join(configsDir, name);
          const config: Config = existsSync(file)
            ? JSON.parse(readFileSync(file, 'utf8'))
            : defaults;

          if (kafkaBroker.length) {
            config.kafka.brokers = kafkaBroker;
          }

          if (schemaRegistry) {
            config.schemaRegistry.uri = schemaRegistry;
          }

          if (key) {
            config.kafka.ssl = {
              ...(config.kafka.ssl || {}),
              key: JSON.stringify(readFileSync(key, 'utf8')),
            };
          }

          if (ca) {
            config.kafka.ssl = {
              ...(config.kafka.ssl || {}),
              ca: JSON.stringify(readFileSync(ca, 'utf8')),
            };
          }

          if (cert) {
            config.kafka.ssl = {
              ...(config.kafka.ssl || {}),
              cert: JSON.stringify(readFileSync(cert, 'utf8')),
            };
          }

          output.log(header('Setting config', name, config));
          writeFileSync(file, JSON.stringify(config), 'utf8');
        } else if (remove) {
          const file = join(configsDir, name);

          if (existsSync(file)) {
            output.log(header('Removing config', name));
            unlinkSync(file);
          } else {
            output.error(`Configuration ${name} (${file}) not found`);
          }
        } else {
          const file = join(configsDir, name);

          if (existsSync(file)) {
            const config: Config = JSON.parse(readFileSync(file, 'utf8'));
            output.log(header('Config', name, config));
          } else {
            output.error(`Configuration ${name} (${file}) not found`);
          }
        }
      });
    });
