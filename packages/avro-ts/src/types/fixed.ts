import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type } from '@ovotech/ts-compose';

export const isFixedType = (type: Schema): type is schema.FixedType =>
  typeof type === 'object' && 'type' in type && type.type === 'fixed';

export const convertFixedType: Convert<schema.FixedType> = (context) => ({
  context,
  type: Type.String,
});
