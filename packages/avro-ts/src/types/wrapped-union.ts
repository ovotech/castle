import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type, mapWithContext, document } from '@ovotech/ts-compose';
import { isUnion } from './union';
import { isRecordType } from './record';
import { convertType } from '../convert';
import { fullName } from '../helpers';

export const isWrappedUnion = (type: Schema): type is schema.RecordType[] =>
  isUnion(type) && type.every(item => isRecordType(item) && type.length > 1);

export const convertWrappedUnionType: Convert<schema.RecordType[]> = (context, schema) => {
  const map = mapWithContext(context, schema, (itemContext, item) => {
    const converted = convertType(itemContext, item);
    return {
      context: converted.context,
      type: Type.TypeLiteral({
        props: schema.map(schemaItem =>
          Type.Prop({
            name: fullName(context, schemaItem),
            isOptional: schemaItem.name === item.name ? false : true,
            type: schemaItem.name === item.name ? converted.type : Type.Never,
          }),
        ),
      }),
    };
  });

  return document(map.context, Type.Union(map.items));
};
