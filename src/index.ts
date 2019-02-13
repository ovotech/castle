import { ArrayType, BaseType, EnumType, Field, LogicalType, MapType, NamedType, RecordType, Type } from './types';

export interface State {
  output: string[];
  repository: { [key: string]: string };
  logicalTypes: { [key: string]: string };
}

export function avroTs(recordType: RecordType, logicalTypes: State['logicalTypes'] = {}): string {
  const state: State = { output: [], repository: {}, logicalTypes };

  convertRecord(recordType, state);
  return state.output.join('\n');
}

function convertRecord(recordType: RecordType, state: State, namespace?: string): string {
  if (recordType.namespace) {
    state.repository[fullyQualifiedName(recordType)] = recordType.name;
  }

  let buffer = `export interface ${recordType.name} {\n`;
  for (const field of recordType.fields) {
    buffer += convertFieldDec(field, state, recordType.namespace) + '\n';
  }
  buffer += '}\n';
  state.output.push(buffer);
  return recordType.name;
}

function convertFieldDec(field: Field, state: State, namespace?: string): string {
  const optional = isOptional(field.type) ? '?' : '';
  const doc = field.doc ? `/**\n * ${field.doc}\n */\n` : '';

  return indent(`${doc}${field.name}${optional}: ${convertType(field.type, state, namespace)};`);
}

function convertType(type: Type, state: State, namespace?: string): string {
  if (typeof type === 'string') {
    return convertPredefinedType(type, state) || convertPrimitive(type) || type;
  } else if (type instanceof Array) {
    return convertArrayType(type, state, namespace);
  } else if (isLogicalType(type)) {
    return convertLogicalType(type, state);
  } else if (isRecordType(type)) {
    return convertRecord(type, state, namespace);
  } else if (isArrayType(type)) {
    return convertType(type.items, state, namespace) + '[]';
  } else if (isMapType(type)) {
    return convertMapType(type, state, namespace);
  } else if (isEnumType(type)) {
    return convertEnum(type);
  } else {
    throw new Error(`Cannot work out type ${type}`);
  }
}

function convertPrimitive(avroType: string): string {
  switch (avroType) {
    case 'long':
    case 'int':
    case 'double':
    case 'float':
      return 'number';
    case 'bytes':
      return 'Buffer';
    case 'null':
      return 'null';
    case 'boolean':
      return 'boolean';
    case 'string':
      return 'string';
    default:
      return 'any';
  }
}

function convertEnum(enumType: EnumType): string {
  return enumType.symbols.map(symbol => JSON.stringify(symbol)).join(' | ');
}

function convertLogicalType(type: LogicalType, state: State): string {
  return state.logicalTypes[type.logicalType] || convertPrimitive(type.type);
}

function convertPredefinedType(type: string, state: State): string {
  return state.repository[type];
}

function convertArrayType(type: Type[], state: State, namespace?: string): string {
  return type
    .map(t => {
      if (typeof t === 'object' && !(t instanceof Array) && isRecordType(t)) {
        return `{ '${fullyQualifiedName(t, namespace)}' : ${convertType(t, state, namespace)} }`;
      } else {
        return convertType(t, state);
      }
    })
    .join(' | ');
}

function convertMapType(type: MapType, state: State, namespace?: string): string {
  return `{ [index:string]:${convertType(type.values, state, namespace)} }`;
}

function isRecordType(type: BaseType): type is RecordType {
  return type.type === 'record';
}

function isArrayType(type: BaseType): type is ArrayType {
  return type.type === 'array';
}

function isMapType(type: BaseType): type is MapType {
  return type.type === 'map';
}

function isEnumType(type: BaseType): type is EnumType {
  return type.type === 'enum';
}

function isLogicalType(type: BaseType): type is LogicalType {
  return 'logicalType' in type;
}

function isUnion(type: Type): type is NamedType[] {
  return type instanceof Array;
}

function isOptional(type: Type): boolean {
  if (isUnion(type)) {
    const t1 = type[0];
    if (typeof t1 === 'string') {
      return t1 === 'null';
    }
  }
  return false;
}

function fullyQualifiedName(type: RecordType, namespace?: string) {
  const currentNamespace = type.namespace || namespace;
  return currentNamespace ? `${currentNamespace}.${type.name}` : type.name;
}

function indent(text: string, prefix = '  ') {
  return text
    .split('\n')
    .map(row => prefix + row)
    .join('\n');
}
