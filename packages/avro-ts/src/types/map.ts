import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type } from '@ovotech/ts-compose';
import { convertType } from '../convert';

export const isMapType = (type: Schema): type is schema.MapType =>
  typeof type === 'object' && 'type' in type && type.type === 'map';

export const convertMapType: Convert<schema.MapType> = (context, schema) => {
  const map = convertType(context, schema.values);
  return {
    context: map.context,
    type: Type.TypeLiteral({
      index: Type.Index({ name: 'index', nameType: Type.String, type: map.type }),
    }),
  };
};
