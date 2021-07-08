import { Schema } from 'avsc';

export interface Heavy {
  userId: number;
  actions: string[];
  time: number;
}

export const HeavySchema: Schema = {
  name: 'Event',
  type: 'record',
  fields: [
    { name: 'time', type: 'long' },
    { name: 'userId', type: 'int' },
    { name: 'actions', type: { type: 'array', items: 'string' } },
  ],
};
