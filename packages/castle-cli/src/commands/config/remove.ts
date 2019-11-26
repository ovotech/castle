import { Command } from 'commander';
import { header, Output } from '../../output';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { configsDir } from '../../config';

export const castleConfigRemove = (command: Command, output = new Output(console)): Command =>
  command
    .name('castle config remove')
    .arguments('<name>')

    .description(
      `Remove a configuration file from the default config directory (${configsDir}).

Example:
  castle config remove uat`,
    )
    .action(async name => {
      await output.wrap(false, async () => {
        const file = join(configsDir, name);

        if (!existsSync(configsDir)) {
          throw new Error(`Config directory (${configsDir}) does not exist`);
        }

        if (!existsSync(file)) {
          throw new Error(`Config file ${name} does not exist in (${configsDir})`);
        }

        output.log(header('Removing config', name));
        unlinkSync(file);
        output.success('Success');
      });
    });
