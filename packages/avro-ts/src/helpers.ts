import { Context } from './types';
import { schema as avroSchema } from 'avsc';
import { Document, Node, withIdentifier, document, Type } from '@ovotech/ts-compose';
import * as ts from 'typescript';

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

  const contextWithRef = namespace
    ? withIdentifier(
        context,
        Node.Const({
          name: `${name}Name`,
          isExport: true,
          value: `${namespace}.${schema.name}`,
        }),
        namespaceName,
      )
    : context;

  return document(withIdentifier(contextWithRef, type, namespaceName), Type.Referance(fullName));
};
