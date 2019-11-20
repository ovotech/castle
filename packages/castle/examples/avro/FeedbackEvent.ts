import { Schema } from 'avsc';

export interface FeedbackEvent {
  id: number;
  status: string;
}

export const FeedbackEventSchema: Schema = {
  type: 'record',
  name: 'Feedback',
  fields: [{ name: 'status', type: 'string' }, { name: 'id', type: 'int' }],
};
