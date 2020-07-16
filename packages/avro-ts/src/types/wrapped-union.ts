import { schema, Schema } from 'avsc';
import { Convert, Context } from '../types';
import { Type, mapWithContext, document } from '@ovotech/ts-compose';
import { isUnion } from './union';
import { isRecordType } from './record';
import { convertType } from '../convert';
import { fullName } from '../helpers';

const resolveItem = (context: Context, item: Schema): Schema =>
  typeof item === 'string' && context.refs?.[item] ? context.refs?.[item] : item;

export const isWrappedUnion = (type: Schema, context: Context): type is schema.RecordType[] =>
  isUnion(type) &&
  type.length > 1 &&
  type.every((item) => isRecordType(resolveItem(context, item)));

export const convertWrappedUnionType: Convert<schema.RecordType[]> = (context, schema) => {
  const resolved = schema.map((item) => resolveItem(context, item) as schema.RecordType);

  const map = mapWithContext(context, resolved, (itemContext, item) => {
    const converted = convertType(itemContext, item);
    return {
      context: converted.context,
      type: Type.TypeLiteral({
        props: resolved.map((schemaItem) => {
          return Type.Prop({
            name: fullName(context, schemaItem),
            isOptional: schemaItem.name === item.name ? false : true,
            type: schemaItem.name === item.name ? converted.type : Type.Never,
          });
        }),
      }),
    };
  });

  return document(map.context, Type.Union(map.items));
};
