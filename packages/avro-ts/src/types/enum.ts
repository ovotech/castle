import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Node, Type } from '@ovotech/ts-compose';
import { convertName, namedType, firstUpperCase } from '../helpers';
import { withDefault } from './record';

export const isEnumType = (type: Schema): type is schema.EnumType =>
  typeof type === 'object' && 'type' in type && type.type === 'enum';

export const convertEnumType: Convert<schema.EnumType> = (context, schema) => {
  const namespace = schema.namespace ?? context.namespace;
  let type;

  if (context.withTypescriptEnums === true) {
    type = Node.Enum({
      name: convertName(firstUpperCase(schema.name)),
      members: schema.symbols.map(val => Node.EnumMember({ name: val, value: val })),
      isExport: true,
      jsDoc: schema.default ? withDefault(schema.default, schema.doc) : schema.doc,
    });
  } else {
    type = Type.Alias({
      name: convertName(firstUpperCase(schema.name)),
      type: Type.Union(schema.symbols.map((symbol) => Type.Literal(symbol))),
      isExport: true,
      jsDoc: schema.doc,
    });
  }


  return namedType(type, context, schema, namespace);
};
