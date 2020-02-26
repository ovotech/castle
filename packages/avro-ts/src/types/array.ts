import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type, document } from '@ovotech/ts-compose';
import { convertType } from '../convert';

export const isArrayType = (type: Schema): type is schema.ArrayType =>
  typeof type === 'object' && 'type' in type && type.type === 'array';

export const convertArrayType: Convert<schema.ArrayType> = (context, schema) => {
  const converted = convertType(context, schema.items);
  return document(converted.context, Type.Array(converted.type));
};
