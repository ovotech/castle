import { Type, Schema } from 'avsc';
import { AvroDecimal } from '@ovotech/avro-decimal';
import { Decimal } from 'decimal.js';

const decimalSchema: Schema = {
  type: 'bytes',
  logicalType: 'decimal',
  precision: 16,
  scale: 8,
};

export const DecimalType = Type.forSchema(decimalSchema, {
  logicalTypes: { decimal: AvroDecimal },
});

const encoded = DecimalType.toBuffer(new Decimal('100.01'));
const decoded = DecimalType.fromBuffer(encoded);

console.log(decoded);
