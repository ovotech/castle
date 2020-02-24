import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type, document, withImports } from '@ovotech/ts-compose';
import { convertType } from '../convert';

export const isLogicalType = (type: Schema): type is schema.LogicalType =>
  typeof type === 'object' && 'logicalType' in type;

export const convertLogicalType: Convert<schema.LogicalType> = (context, schema) => {
  const logicalType = context.logicalTypes?.[schema.logicalType];
  if (logicalType) {
    if (typeof logicalType === 'string') {
      return document(context, Type.Ref(logicalType));
    } else {
      return document(
        withImports(
          context,
          'named' in logicalType
            ? { ...logicalType, named: [{ name: logicalType.named }] }
            : logicalType,
        ),
        Type.Ref(
          'named' in logicalType
            ? logicalType.named
            : 'defaultAs' in logicalType
            ? logicalType.defaultAs
            : logicalType.allAs,
        ),
      );
    }
  }
  return convertType(context, schema.type);
};
