import { Schema } from 'avsc';

export interface Light {
  userId: number;
}

export const LightSchema: Schema = {
  name: 'LightEvent',
  aliases: ['Event'],
  type: 'record',
  fields: [{ name: 'userId', type: 'int' }],
};
