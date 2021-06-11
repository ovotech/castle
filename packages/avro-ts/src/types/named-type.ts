import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { convertPrimitiveType, isPrimitiveType } from './primitive';

export const isNamedType = (type: Schema): type is schema.NamedType =>
  typeof type === 'object' && 'type' in type && isPrimitiveType(type.type);

export const convertNamedType: Convert<schema.NamedType> = (context, schema) =>
  convertPrimitiveType(context, schema.type);
