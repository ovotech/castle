import { Schema } from 'avsc';
import { document, Type, printDocument } from '@ovotech/ts-compose';
import { Convert, Context } from './types';
import { isWrappedUnion, convertWrappedUnionType } from './types/wrapped-union';
import { isUnion, convertUnionType } from './types/union';
import { isLogicalType, convertLogicalType } from './types/logical';
import { isRecordType, convertRecordType } from './types/record';
import { isArrayType, convertArrayType } from './types/array';
import { isMapType, convertMapType } from './types/map';
import { isEnumType, convertEnumType } from './types/enum';
import { isPrimitiveType, convertPrimitiveType } from './types/primitive';
import { isFixedType, convertFixedType } from './types/fixed';
import { withHeader } from '@ovotech/ts-compose/dist/document';
import * as ts from 'typescript';
import { fullName } from './helpers';

export const firstUpperCase = (name: string): string =>
  name ? name[0].toUpperCase() + name.slice(1) : name;

export const convertNamespace = (namespace: string): string =>
  namespace.split('.').map(firstUpperCase).join('');

export const nameParts = (fullName: string): [string] | [string, string] => {
  const parts = fullName.split('.');
  return parts.length > 1
    ? [parts.slice(parts.length - 1)[0], parts.slice(0, parts.length - 1).join('.')]
    : [parts[0]];
};

export const collectRefs = (type: Schema, context: Context): Context => {
  if (isUnion(type)) {
    return type.reduce((all, item) => collectRefs(item, all), context);
  } else if (isArrayType(type)) {
    return collectRefs(type.items, context);
  } else if (isMapType(type)) {
    return collectRefs(type.values, context);
  } else if (isRecordType(type)) {
    return type.fields.reduce(
      (all, item) =>
        collectRefs(item.type, {
          ...all,
          namespace: type.namespace ?? all.namespace,
          refs: { ...all.refs, [fullName(all, type)]: type },
        }),
      context,
    );
  } else {
    return context;
  }
};

export const convertType: Convert = (context, type) => {
  if (isWrappedUnion(type, context)) {
    return convertWrappedUnionType(context, type);
  } else if (isUnion(type)) {
    return convertUnionType(context, type);
  } else if (isLogicalType(type)) {
    return convertLogicalType(context, type);
  } else if (isRecordType(type)) {
    return convertRecordType(context, type);
  } else if (isArrayType(type)) {
    return convertArrayType(context, type);
  } else if (isMapType(type)) {
    return convertMapType(context, type);
  } else if (isEnumType(type)) {
    return convertEnumType(context, type);
  } else if (isFixedType(type)) {
    return convertFixedType(context, type);
  } else if (isPrimitiveType(type)) {
    return convertPrimitiveType(context, type);
  } else if (typeof type === 'string') {
    const [name, nameNamespace] = nameParts(type);
    const namespace = nameNamespace ?? context.namespace;

    const ref = namespace
      ? Type.Referance([convertNamespace(namespace), firstUpperCase(name)])
      : Type.Referance(firstUpperCase(name));

    return document(context, ref);
  } else {
    throw new Error(`Cannot work out type ${type}`);
  }
};

export const toTypeScript = (schema: Schema, initial: Context = {}): string => {
  const contextWithRefs = collectRefs(schema, initial);
  const { context, type } = convertType(contextWithRefs, schema);

  const contextWithHeader = context.namespaces
    ? withHeader(context, '/* eslint-disable @typescript-eslint/no-namespace */')
    : context;

  const name =
    ts.isTypeReferenceNode(type) && ts.isQualifiedName(type.typeName)
      ? type.typeName.right
      : 'AvroType';

  return printDocument(document(contextWithHeader, Type.Alias({ name, isExport: true, type })));
};
