import { Schema, schema } from 'avsc';
import * as ts from 'typescript';

export interface Registry {
  [key: string]: ts.InterfaceDeclaration;
}

export interface Context {
  recordAlias: string;
  namespacedPrefix: string;
  registry: Registry;
  unionMember: boolean;
  namespace?: string;
  namespaces: { [key: string]: ts.TypeReferenceNode };
  logicalTypes: { [key: string]: ts.TypeReferenceNode };
  visitedLogicalTypes: Array<string>;
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

export const withContexts = (context: Context, items: Context[]) =>
  items.reduce(
    (all, itemContext) => ({
      ...all,
      registry: { ...all.registry, ...itemContext.registry },
      namespaces: { ...all.namespaces, ...itemContext.namespaces },
    }),
    context,
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
  const fieldContext = { ...namespaceContext, unionMember: false };

  const fields = type.fields.map(fieldType => {
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
    fields.map(field => field.type),
  );
  const recordContext = withContexts(withEntry(fieldContext, interfaceType), fields.map(item => item.context));

  if (context.unionMember) {
    const namespaced = fullyQualifiedName(context, type);
    const prop = ts.createPropertySignature(
      undefined,
      ts.createStringLiteral(namespaced),
      undefined,
      ts.createTypeReferenceNode(type.name, undefined),
      undefined,
    );
    const namespacedInterfaceType = ts.createInterfaceDeclaration(
      undefined,
      [ts.createToken(ts.SyntaxKind.ExportKeyword)],
      `${context.namespacedPrefix}${type.name}`,
      undefined,
      undefined,
      [prop],
    );
    return result(
      withEntry(recordContext, namespacedInterfaceType),
      ts.createTypeReferenceNode(namespacedInterfaceType.name.text, undefined),
    );
  }
  return result(recordContext, ts.createTypeReferenceNode(type.name, undefined));
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

const convertLogicalType: Convert<schema.LogicalType> = (context, type) => {
  if (context.logicalTypes[type.logicalType]) {
    if (!context.visitedLogicalTypes.includes(type.logicalType)) context.visitedLogicalTypes.push(type.logicalType);
    return result(context, context.logicalTypes[type.logicalType]);
  }
  return convertPrimitive(context, type.type);
};

const convertPredefinedType: Convert<string> = (context, type) =>
  context.namespaces[type] ? result(context, context.namespaces[type]) : convertPrimitive(context, type);

const convertArrayType: Convert<any[]> = (context, type) => {
  const map = mapContext(context, type, (itemContext, item) => {
    if (typeof item === 'object' && !Array.isArray(item) && isRecordType(item)) {
      return convertType({ ...itemContext, unionMember: true }, item);
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

const printAstNode = (node: Result<ts.Node>, extras: { importLines?: Array<string> } = {}): string => {
  const resultFile = ts.createSourceFile('someFileName.ts', '', ts.ScriptTarget.Latest);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const entries = Object.values(node.context.registry);
  const fullSourceFile = ts.updateSourceFileNode(resultFile, entries);

  const importLines = extras.importLines || [];

  return importLines
    .concat(
      printer.printNode(ts.EmitHint.Unspecified, node.type, fullSourceFile),
      entries.map(entry => printer.printNode(ts.EmitHint.Unspecified, entry, fullSourceFile)),
    )
    .join('\n\n');
};

type LogicalTypeWithImport = { import: string; type: string };
type LogicalTypeDefinition = string | LogicalTypeWithImport;

type AvroTsOptions = {
  logicalTypes?: { [key: string]: LogicalTypeDefinition };
  recordAlias?: string;
  namespacedPrefix?: string;
};
const defaultOptions = {
  recordAlias: 'Record',
  namespacedPrefix: 'Namespaced',
};

export function avroTs(recordType: schema.RecordType, options: AvroTsOptions = {}): string {
  const logicalTypes = options.logicalTypes || {};
  const context: Context = {
    ...defaultOptions,
    ...options,
    unionMember: Array.isArray(recordType),
    registry: {},
    namespaces: {},
    visitedLogicalTypes: [],
    logicalTypes: Object.entries(logicalTypes).reduce((all, [name, type]) => {
      const typeStr = (type as LogicalTypeWithImport).type ? (type as LogicalTypeWithImport).type : (type as string);
      return {
        ...all,
        [name]: ts.createTypeReferenceNode(typeStr, undefined),
      };
    }, {}),
  };

  const nodes = convertType(context, recordType);

  const importLines = context.visitedLogicalTypes
    .map(visitedType => (logicalTypes[visitedType] as LogicalTypeWithImport).import)
    .filter(Boolean);

  return printAstNode(
    {
      context: nodes.context,

      type: ts.createTypeAliasDeclaration(
        undefined,
        [ts.createToken(ts.SyntaxKind.ExportKeyword)],
        context.recordAlias,
        undefined,
        nodes.type,
      ),
    },
    { importLines },
  );
}
