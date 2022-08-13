import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id', type: 'int' },
    {
      "name": "status",
      "type": { "type": "enum", "name": "Status", "symbols": ["Active", "Inactive"] },
      "doc": "The status of the user account"
    },
  ],
};

const ts = toTypeScript(avro, { withTypescriptEnums: true });

console.log(ts);


