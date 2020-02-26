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
  type === 'string';

export const convertPrimitiveType: Convert<schema.PrimitiveType> = (context, schema) =>
  document(context, primitiveTypeMap[schema] ?? Type.Any);
