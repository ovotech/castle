import { Schema, schema } from 'avsc';
import * as ts from 'typescript';

export interface Registry {
  [key: string]: ts.InterfaceDeclaration;
}

export interface Context {
  registry: Registry;
  root: boolean;
  namespace?: string;
  namespaces: { [key: string]: ts.TypeReferenceNode };
  logicalTypes: { [key: string]: ts.TypeReferenceNode };
}

export interface Result<TsType = ts.TypeNode> {
  type: TsType;
  context: Context;
}

export type Convert<TType = Schema> = (context: Context, type: TType) => Result<any>;

export const result = <TsType = ts.TypeNode>(context: Context, type: TsType): Result<TsType> => ({
  context,
  type,
});

export const mapContext = <T = any, TsType = ts.TypeNode>(
  context: Context,
  items: T[],
  callbackfn: (context: Context, item: T) => Result<TsType>,
) =>
  items.reduce<{ items: TsType[]; context: Context }>(
    (all, item) => {
      const current = callbackfn(all.context, item);
      return {
        items: [...all.items, current.type],
        context: current.context,
      };
    },
    { items: [], context },
  );

export const withEntry = (context: Context, entry: ts.InterfaceDeclaration): Context => ({
  ...context,
  registry: { ...context.registry, [entry.name.text]: entry },
});

export const withNamespace = (context: Context, record: schema.RecordType): Context => ({
  ...context,
  namespace: record.namespace,
  namespaces: {
    ...context.namespaces,
    [fullyQualifiedName(context, record)]: ts.createTypeReferenceNode(record.name, undefined),
  },
});

export interface State {
  output: string[];
  repository: { [key: string]: string };
  logicalTypes: { [key: string]: string };
}

const docToJSDoc = (doc: string) =>
  `*\n${doc
    .split('\n')
    .map(line => ` * ${line}`)
    .join('\n')}\n `;

const convertRecord: Convert<schema.RecordType> = (context, type) => {
  const namespaceContext = type.namespace ? withNamespace(context, type) : context;

  const fields = mapContext({ ...namespaceContext, root: false }, type.fields, (fieldContext, fieldType) => {
    const field = convertType(fieldContext, fieldType.type);
    const prop = ts.createPropertySignature(
      undefined,
      fieldType.name,
      isOptional(fieldType.type) ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined,
      field.type,
      undefined,
    );

    const propWithDoc = fieldType.doc
      ? ts.addSyntheticLeadingComment(prop, ts.SyntaxKind.MultiLineCommentTrivia, docToJSDoc(fieldType.doc), true)
      : prop;

    return result(field.context, propWithDoc);
  });

  const interfaceType = ts.createInterfaceDeclaration(
    undefined,
    [ts.createToken(ts.SyntaxKind.ExportKeyword)],
    type.name,
    undefined,
    undefined,
    fields.items,
  );

  if (context.root) {
    return result(fields.context, interfaceType);
  } else {
    return result(withEntry(fields.context, interfaceType), ts.createTypeReferenceNode(type.name, undefined));
  }
};

const convertType: Convert = (context, type) => {
  if (typeof type === 'string') {
    return convertPredefinedType(context, type);
  } else if (Array.isArray(type)) {
    return convertArrayType(context, type);
  } else if (isLogicalType(type)) {
    return convertLogicalType(context, type);
  } else if (isRecordType(type)) {
    return convertRecord(context, type);
  } else if (isArrayType(type)) {
    const itemType = convertType(context, type.items);
    return result(itemType.context, ts.createArrayTypeNode(itemType.type));
  } else if (isMapType(type)) {
    return convertMapType(context, type);
  } else if (isEnumType(type)) {
    return convertEnum(context, type);
  } else {
    throw new Error(`Cannot work out type ${type}`);
  }
};

const convertPrimitive: Convert = (context, avroType) => {
  switch (avroType) {
    case 'long':
    case 'int':
    case 'double':
    case 'float':
      return result(context, ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword));
    case 'bytes':
      return result(context, ts.createTypeReferenceNode('Buffer', undefined));
    case 'null':
      return result(context, ts.createNull());
    case 'boolean':
      return result(context, ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword));
    case 'string':
      return result(context, ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword));
    default:
      return result(context, ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
  }
};

const convertEnum: Convert<schema.EnumType> = (context, enumType) =>
  result(
    context,
    ts.createUnionTypeNode(enumType.symbols.map(symbol => ts.createLiteralTypeNode(ts.createLiteral(symbol)))),
  );

const convertLogicalType: Convert<schema.LogicalType> = (context, type) =>
  context.logicalTypes[type.logicalType]
    ? result(context, context.logicalTypes[type.logicalType])
    : convertPrimitive(context, type.type);

const convertPredefinedType: Convert<string> = (context, type) =>
  context.namespaces[type] ? result(context, context.namespaces[type]) : convertPrimitive(context, type);

const convertArrayType: Convert<any[]> = (context, type) => {
  const map = mapContext(context, type, (itemContext, item) => {
    if (typeof item === 'object' && !Array.isArray(item) && isRecordType(item)) {
      const itemType = convertType(itemContext, item);
      return result(
        itemType.context,
        ts.createTypeLiteralNode([
          ts.createPropertySignature(
            undefined,
            ts.createStringLiteral(fullyQualifiedName(context, item)),
            undefined,
            itemType.type,
            undefined,
          ),
        ]),
      );
    } else {
      return convertType(itemContext, item);
    }
  });

  return result(map.context, ts.createUnionTypeNode(map.items));
};

const convertMapType: Convert<schema.MapType> = (context, type) => {
  const map = convertType(context, type.values);
  return result(
    map.context,
    ts.createTypeLiteralNode([
      ts.createIndexSignature(
        undefined,
        undefined,
        [
          ts.createParameter(
            undefined,
            undefined,
            undefined,
            'index',
            undefined,
            ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
            undefined,
          ),
        ],
        map.type,
      ),
    ]),
  );
};

const isRecordType = (type: Schema): type is schema.RecordType =>
  typeof type === 'object' && 'type' in type && type.type === 'record';

const isArrayType = (type: Schema): type is schema.ArrayType =>
  typeof type === 'object' && 'type' in type && type.type === 'array';

const isMapType = (type: Schema): type is schema.MapType =>
  typeof type === 'object' && 'type' in type && type.type === 'map';

const isEnumType = (type: Schema): type is schema.EnumType =>
  typeof type === 'object' && 'type' in type && type.type === 'enum';

const isLogicalType = (type: Schema): type is schema.LogicalType => typeof type === 'object' && 'logicalType' in type;

const isUnion = (type: Schema): type is schema.NamedType[] => typeof type === 'object' && Array.isArray(type);

const isOptional = (type: Schema): boolean => {
  if (isUnion(type)) {
    const t1 = type[0];
    if (typeof t1 === 'string') {
      return t1 === 'null';
    }
  }
  return false;
};

const fullyQualifiedName = (context: Context, type: schema.RecordType) => {
  const currentNamespace = type.namespace || context.namespace;
  return currentNamespace ? `${currentNamespace}.${type.name}` : type.name;
};

export const printAstNode = (node: Result): string => {
  const resultFile = ts.createSourceFile('someFileName.ts', '', ts.ScriptTarget.Latest);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const entries = Object.values(node.context.registry);
  const fullSourceFile = ts.updateSourceFileNode(resultFile, entries);

  return [
    printer.printNode(ts.EmitHint.Unspecified, node.type, fullSourceFile),
    ...entries.map(entry => printer.printNode(ts.EmitHint.Unspecified, entry, fullSourceFile)),
  ].join('\n\n');
};

export function avroTs(recordType: schema.RecordType, logicalTypes: { [key: string]: string } = {}): string {
  const context: Context = {
    root: true,
    registry: {},
    namespaces: {},
    logicalTypes: Object.entries(logicalTypes).reduce(
      (all, [name, type]) => ({ ...all, [name]: ts.createTypeReferenceNode(type, undefined) }),
      {},
    ),
  };

  return printAstNode(convertRecord(context, recordType));
}
