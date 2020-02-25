import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'createdAt', type: { type: 'long', logicalType: 'timestamp-millis' } },
  ],
};

const ts = toTypeScript(avro, {
  logicalTypes: {
    'timestamp-millis': 'string',
  },
});

console.log(ts);
