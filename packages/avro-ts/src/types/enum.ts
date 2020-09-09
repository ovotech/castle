import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type } from '@ovotech/ts-compose';
import { namedType, firstUpperCase } from '../helpers';

export const isEnumType = (type: Schema): type is schema.EnumType =>
  typeof type === 'object' && 'type' in type && type.type === 'enum';

export const convertEnumType: Convert<schema.EnumType> = (context, schema) => {
  const namespace = schema.namespace ?? context.namespace;

  const type = Type.Alias({
    name: firstUpperCase(schema.name),
    type: Type.Union(schema.symbols.map((symbol) => Type.Literal(symbol))),
    isExport: true,
    jsDoc: schema.doc,
  });

  return namedType(type, context, schema, namespace);
};
