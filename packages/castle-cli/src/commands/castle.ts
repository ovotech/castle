import * as commander from 'commander';
import { castleTopic } from './topic';
import { castleSchema } from './schema';
import { castleConfig } from './config';
import { castleGroup } from './group';
import { Output } from '../output';

export const castle = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('castle')
    .version('0.4.3')
    .description(
      `Castle CLI - a tool for inspecting kafka topics with schema registry.

By default connects to local kafka (localhost:29092) and schema registry (localhost:8081). But can define a config file that can be used to connect to external servers.

Contains several groups of subcommands:

castle topic
  Subcommands for searching and manipulating kafka topics, as well as producing and consuming events from them.
  search, consume, produce, message, create, show, update

castle schema
  Subcommands for getting schema versions of kafka topics.
  search, show

castle config
  Subcommands to create / edit connection configs to kafka brokers and schema registers, that can be used by other commands.
  create, search, remove

castle group
  Subcommands to manipulate consumer group offsets.
  search, update

Example:
  castle topic my-topic
  castle consume my-topic
  castle config uat --kafka-broker example.com:3203 --key private.pem --ca ca.pem --cert cert.pem --schema-registry http://example.com:8081
  castle topic my-topic --config uat
`,
    )
    .addCommand(castleTopic(output))
    .addCommand(castleSchema(output))
    .addCommand(castleConfig(output))
    .addCommand(castleGroup(output));
