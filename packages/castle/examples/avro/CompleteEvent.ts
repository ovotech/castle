import { Schema } from 'avsc';

export interface CompleteEvent {
  id: number;
}

export const CompleteEventSchema: Schema = {
  type: 'record',
  name: 'CompleteEvent',
  fields: [{ name: 'id', type: 'int' }],
};
