import { Schema, schema } from 'avsc';
import { document, Node, Type, printNode } from '@ovotech/ts-compose';
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
import {  withImports } from '@ovotech/ts-compose/dist/document';
import { fullName, firstUpperCase, nameParts, convertName } from './helpers';
import * as ts from 'typescript';
import { convertNamedType, isNamedType } from './types/named-type';

export const addRef = (type: schema.RecordType | schema.EnumType, context: Context): Context => ({
  ...context,
  namespace: type.namespace ?? context.namespace,
  refs: {
    ...context.refs,
    [fullName(context, type)]: { ...type, namespace: type.namespace ?? context.namespace },
  },
});

export const collectRefs = (type: Schema, context: Context): Context => {
  if (isUnion(type)) {
    return type.reduce((all, item) => collectRefs(item, all), context);
  } else if (isArrayType(type)) {
    return collectRefs(type.items, context);
  } else if (isMapType(type)) {
    return collectRefs(type.values, context);
  } else if (isEnumType(type)) {
    return addRef(type, context);
  } else if (isRecordType(type)) {
    return type.fields.reduce((all, item) => collectRefs(item.type, all), addRef(type, context));
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
  } else if (isNamedType(type)) {
    return convertNamedType(context, type);
  } else if (typeof type === 'string') {
    const [name, nameNamespace] = nameParts(type);
    const namespace = nameNamespace ?? context.namespace;
    const typeName = convertName(firstUpperCase(name));

    if (namespace && context.external && !context.refs?.[type]) {
      for (const module in context.external) {
        if (context.external[module][type]) {
          const externalContext = withImports(context, { named: [{ name: typeName }], module });
          return document(externalContext, Type.Referance(typeName));
        }
      }
    }

    return document(context, Type.Referance(typeName));
  } else {
    throw new Error(`Cannot work out type ${JSON.stringify(type)}`);
  }
};

export const toTypeScript = (schema: Schema, initial: Context = {}): string => {
  const contextWithRefs = collectRefs(schema, initial);
  const { context, type } = convertType(contextWithRefs, schema);

  const isNamedRoot =
    ts.isTypeReferenceNode(type) &&
    ts.isIdentifier(type.typeName) &&
    context.identifiers?.[type.typeName.text] !== undefined;

  const contextWithRoot = isNamedRoot
    ? context
    : { ...context, identifiers: { ...context.identifiers, AvroType: Type.Alias({ name: 'AvroType', isExport: true, type }) } };

  const imports = contextWithRoot.imports ? Object.values(contextWithRoot.imports) : [];
  const identifiers = contextWithRoot.identifiers ? Object.values(contextWithRoot.identifiers) : [];

  return (
    [...imports.map((item) => Node.Import(item)), ...identifiers].map(printNode).join('\n\n') + '\n'
  );
};

export const toExternalContext = (
  schema: Schema,
  initial: Context = {},
): { [key: string]: Schema } => {
  const contextWithRefs = collectRefs(schema, initial);
  const { context } = convertType(contextWithRefs, schema);
  return context.refs ?? {};
};
