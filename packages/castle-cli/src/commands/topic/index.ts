import * as commander from 'commander';
import { castleTopicShow } from './show';
import { castleTopicUpdate } from './update';
import { castleTopicSearch } from './search';
import { castleTopicCreate } from './create';
import { castleTopicConsume } from './consume';
import { castleTopicProduce } from './produce';
import { castleTopicMessage } from './message';
import { Output } from '../../output';

export const castleTopic = (output = new Output(console)): commander.Command =>
  commander
    .createCommand('topic')
    .description(
      'Subcommands for searching and manipulating kafka topics, as well as producing and consuming events from them.',
    )
    .addCommand(castleTopicShow(output))
    .addCommand(castleTopicUpdate(output))
    .addCommand(castleTopicSearch(output))
    .addCommand(castleTopicCreate(output))
    .addCommand(castleTopicConsume(output))
    .addCommand(castleTopicProduce(output))
    .addCommand(castleTopicMessage(output));
