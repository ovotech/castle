import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    { name: 'id', type: 'int' },
    { name: 'decimalValue', type: { type: 'long', logicalType: 'decimal' } },
    { name: 'anotherDecimal', type: { type: 'long', logicalType: 'decimal' } },
  ],
};

const ts = toTypeScript(avro, {
  logicalTypes: {
    decimal: { module: 'decimal.js', named: 'Decimal' },
  },
});

console.log(ts);
