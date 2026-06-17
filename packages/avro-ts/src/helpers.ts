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

// A single const, like `UserName = "com.example.User"`.
interface NamespaceConst {
  name: string;
  value: string;
}

// private symbol so that our internal accumlator it stays internal and doesn't pollute either public api
// or ts-compose internals
const siblingConsts = Symbol('siblingConsts');

type Namespace = string;

// The consts destined for each namespace's sibling object literal.
type SiblingConsts = Record<Namespace, NamespaceConst[]>;

type ContextWithSiblingConsts = Context & { [siblingConsts]?: SiblingConsts };

// collect consts for a namespace's sibling object literal, returning a new context.
const withSiblingConsts = (
  context: ContextWithSiblingConsts,
  namespaceName: Namespace,
  consts: NamespaceConst[],
): ContextWithSiblingConsts => {
  const collected = context[siblingConsts] ?? {};
  const existing = collected[namespaceName] ?? [];

  return {
    ...context,
    [siblingConsts]: {
      ...collected,
      [namespaceName]: [...existing, ...consts],
    },
  };
};

// Declare consts inside the namespace.
const withNamespaceConsts = (
  context: Context,
  namespaceName: Namespace,
  consts: NamespaceConst[],
): Context => {
  let result = context;
  for (const { name, value } of consts) {
    result = withIdentifier(result, Node.Const({ name, isExport: true, value }), namespaceName);
  }
  return result;
};

// Emit each namespace's collected consts as a sibling `const <Namespace> = { ... }` object literal.
export function withSiblingObjects(context: ContextWithSiblingConsts): Context {
  let result: Context = context;

  for (const [namespaceName, consts] of Object.entries(context[siblingConsts] ?? {})) {
    const members: Record<string, string> = {};
    for (const { name, value } of consts) {
      members[name] = value;
    }
    result = withIdentifier(
      result,
      Node.Const({ name: namespaceName, isExport: true, multiline: true, value: members }),
    );
  }
  return result;
}

export function namedType(
  type: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration,
  context: Context,
  schema: avroSchema.RecordType | avroSchema.EnumType,
  namespace?: string,
): Document<ts.TypeNode, Context> {
  const name = convertName(firstUpperCase(schema.name));
  const namespaceName = namespace ? convertName(namespace) : undefined;

  // No namespace: the type is emitted at the top level, with no schema/name consts.
  if (!namespace || !namespaceName) {
    return document(withIdentifier(context, type), Type.Referance(name));
  }

  const reference = Type.Referance([namespaceName, name]);
  const fieldName = `${name}Name`;
  const schemaName = `${namespace}.${fieldName}`;
  const value = `${namespace}.${schema.name}`;
  const schemaJson = JSON.stringify(schema);

  // On a name collision with an existing ref, prefix the const names with the namespace.
  const prefix = context.refs && schemaName in context.refs ? namespaceName : '';
  const schemaConstName = `${prefix}${name}Schema`;
  const nameConstName = `${prefix}${fieldName}`;

  const consts: NamespaceConst[] = [
    { name: schemaConstName, value: schemaJson },
    { name: nameConstName, value },
  ];

  const contextWithConsts = context.experimentalTypeOnlyNamespaces
    ? withSiblingConsts(context, namespaceName, consts)
    : withNamespaceConsts(context, namespaceName, consts);

  return document(withIdentifier(contextWithConsts, type, namespaceName), reference);
}
