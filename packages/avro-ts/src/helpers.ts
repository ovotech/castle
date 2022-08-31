import { Document, document, Node, Type, withIdentifier } from '@ovotech/ts-compose';
import { schema as avroSchema } from 'avsc';
import * as ts from 'typescript';
import { Context } from './types';

export const fullName = (
  context: Context,
  schema: avroSchema.RecordType | avroSchema.EnumType,
): string => `${schema.namespace ?? context.namespace}.${schema.name}`;

export const firstUpperCase = (name: string): string =>
  name ? name[0].toUpperCase() + name.slice(1) : name;

export const convertName = (namespace: string): string =>
  namespace
    .split(/[^a-zA-Z0-9\_]+/)
    .map(firstUpperCase)
    .join('');

export const nameParts = (fullName: string): [string] | [string, string] => {
  const parts = fullName.split('.');
  return parts.length > 1
    ? [parts.slice(parts.length - 1)[0], parts.slice(0, parts.length - 1).join('.')]
    : [parts[0]];
};

export const namedType = (
  type: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration,
  context: Context,
  schema: avroSchema.RecordType | avroSchema.EnumType,
  namespace?: string,
): Document<ts.TypeNode, Context> => {
  const name = convertName(firstUpperCase(schema.name));
  const namespaceName = namespace ? convertName(namespace) : undefined;

  const fullName = namespaceName ? [namespaceName, name] : name;
  const fieldName = `${name}Name`;
  const schemaName = `${namespace}.${fieldName}`;
  const value = `${namespace}.${schema.name}`;

  const contextWithRef = namespace
    ? /**
       * If there is already a ref with the same name as our "named type", it means there is already
       * a type with the same name and we're about to have a naming collision. To avoid this, we
       * use the fully qualified name instead.
       */
      context.refs && schemaName in context.refs
      ? withIdentifier(
          context,
          Node.Const({ name: `${namespaceName}${fieldName}`, isExport: true, value }),
          namespaceName,
        )
      : withIdentifier(
          context,
          Node.Const({ name: fieldName, isExport: true, value }),
          namespaceName,
        )
    : context;

  return document(withIdentifier(contextWithRef, type, namespaceName), Type.Referance(fullName));
};
