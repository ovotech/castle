import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type } from '@ovotech/ts-compose';

export const isEnumType = (type: Schema): type is schema.EnumType =>
  typeof type === 'object' && 'type' in type && type.type === 'enum';

export const convertEnumType: Convert<schema.EnumType> = (context, type) => ({
  context,
  type: Type.Union(type.symbols.map(symbol => Type.Literal(symbol))),
});
