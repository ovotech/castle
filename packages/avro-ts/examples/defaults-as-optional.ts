import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'User',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'username', type: 'string', default: 'Simon' },
  ],
};

const ts = toTypeScript(avro, { defaultsAsOptional: true });

console.log(ts);
