import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  namespace: 'com.example.avro',
  fields: [
    { name: 'id', type: 'int' },
    {
      name: 'event',
      type: [
        {
          type: 'record',
          name: 'ElectricityEvent',
          fields: [
            { name: 'accountId', type: 'string' },
            { name: 'MPAN', type: 'string' },
          ],
        },
        {
          type: 'record',
          name: 'GasEvent',
          fields: [
            { name: 'accountId', type: 'string' },
            { name: 'MPRN', type: 'string' },
          ],
        },
      ],
    },
  ],
};

const ts = toTypeScript(avro);

console.log(ts);
