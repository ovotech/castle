import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type, mapWithContext, document } from '@ovotech/ts-compose';
import { convertType } from '../convert';

export const isUnion = (type: Schema): type is (schema.NamedType | schema.PrimitiveType)[] =>
  typeof type === 'object' && Array.isArray(type);

export const convertUnionType: Convert<schema.DefinedType[]> = (context, schema) => {
  const map = mapWithContext(context, schema, convertType);
  return document(map.context, Type.Union(map.items));
};
