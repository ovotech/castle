import { Schema } from 'avsc';

export interface Event {
  field1: string;
}

export const EventSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};
