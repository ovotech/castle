import { schema, Schema } from 'avsc';
import * as ts from 'typescript';
import { Convert } from '../types';
import { Type, document } from '@ovotech/ts-compose';

const primitiveTypeMap: {
  [key in schema.PrimitiveType]: ts.TypeNode;
} = {
  long: Type.Number,
  int: Type.Number,
  double: Type.Number,
  float: Type.Number,
  bytes: Type.Referance('Buffer'),
  null: Type.Null,
  boolean: Type.Boolean,
  string: Type.String,
};

export const isPrimitiveType = (type: Schema): type is schema.PrimitiveType =>
  type === 'null' ||
  type === 'boolean' ||
  type === 'int' ||
  type === 'long' ||
  type === 'float' ||
  type === 'double' ||
  type === 'bytes' ||
  type === 'string' ||
  (typeof type === 'object' &&
    'type' in type &&
    typeof type.type === 'string' &&
    isPrimitiveType(type.type));

export const convertPrimitiveType: Convert<schema.PrimitiveType> = (context, schema) => {
  let tmp: schema.PrimitiveType = schema;
  if (typeof schema === 'object' && 'type' in schema) {
    tmp = (schema as { type: 'string' }).type;
  }

  return document(context, primitiveTypeMap[tmp] ?? Type.Any);
};
