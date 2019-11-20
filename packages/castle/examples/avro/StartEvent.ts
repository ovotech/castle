import { Schema } from 'avsc';

export interface StartEvent {
  id: number;
}

export const StartEventSchema: Schema = {
  type: 'record',
  name: 'StartEvent',
  fields: [{ name: 'id', type: 'int' }],
};
