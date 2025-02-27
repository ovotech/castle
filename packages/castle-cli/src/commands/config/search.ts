import * as commander from 'commander';
import { configsDir } from '../../config';
import { Output, table, highlight, connection, header } from '../../output';
import { join } from 'path';
import { readFileSync, existsSync, readdirSync } from 'fs';

const loadConfig = (file: string): string => {
  try {
    return connection(JSON.parse(readFileSync(file, 'utf8')));
  } catch (error) {
    return `[Error: ${error instanceof Error ? error.message : 'unknown error'}]`;
  }
};

export const castleConfigSearch = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('search')
    .arguments('[name]')
    .description(
      `Search for configuration files inside the default config directory (${configsDir})

Example:
  castle config search
  castle config search uat
`,
    )
    .action(async (name = '') => {
      await output.wrap(false, async () => {
        if (!existsSync(configsDir)) {
          throw new Error(`Config directory (${configsDir}) does not exist`);
        }

        const all = readdirSync(configsDir);
        const configs = name ? all.filter((config) => config.includes(name)) : all;

        output.log(header('Searching for config', name));

        output.log(
          table([
            ['Config name', 'Details'],
            ...configs.map((config) => {
              return [highlight(config, name), loadConfig(join(configsDir, config))];
            }),
          ]),
        );
      });
    });
