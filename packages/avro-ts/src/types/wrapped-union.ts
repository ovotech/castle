import { schema, Schema } from 'avsc';
import { Convert, Context } from '../types';
import { Type, mapWithContext, document } from '@ovotech/ts-compose';
import { isUnion } from './union';
import { isRecordType } from './record';
import { convertType } from '../convert';
import { fullName } from '../helpers';

const resolveItem = (context: Context, item: Schema): Schema =>
  typeof item === 'string' && context.refs?.[item] ? context.refs?.[item] : item;

type WrappedUnionItem = schema.RecordType | 'null';

export const isWrappedUnion = (type: Schema, context: Context): type is WrappedUnionItem[] =>
  isUnion(type) &&
  type.filter((item) => item !== 'null').length > 1 &&
  type.filter((item) => item !== 'null').every((item) => isRecordType(resolveItem(context, item)));

export const convertWrappedUnionType: Convert<WrappedUnionItem[]> = (context, schema) => {
  const resolved = schema.map((item) => resolveItem(context, item) as WrappedUnionItem);

  const map = mapWithContext(context, resolved, (itemContext, item) => {
    const converted = convertType(itemContext, item);

    return {
      context: { ...converted.context, namespace: context.namespace },
      type: isRecordType(item)
        ? Type.TypeLiteral({
            props: resolved.filter(isRecordType).map((schemaItem) => {
              return Type.Prop({
                name: fullName(context, schemaItem),
                isOptional: schemaItem.name === item.name ? false : true,
                type: schemaItem.name === item.name ? converted.type : Type.Never,
              });
            }),
          })
        : Type.Null,
    };
  });

  return document(map.context, Type.Union(map.items));
};
