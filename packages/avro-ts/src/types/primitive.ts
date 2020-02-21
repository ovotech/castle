import { schema, Schema } from 'avsc';
import * as ts from 'typescript';
import { Convert } from '../types';
import { Type, document } from '@ovotech/ts-compose';

const primitiveTypeMap: {
  [key in schema.PrimitiveType]: ts.TypeNode;
} = {
  long: Type.Num,
  int: Type.Num,
  double: Type.Num,
  float: Type.Num,
  bytes: Type.Ref('Buffer'),
  null: Type.Null,
  boolean: Type.Bool,
  string: Type.Str,
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
