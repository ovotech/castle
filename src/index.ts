import {
  EnumType,
  Field,
  isArrayType,
  isEnumType,
  isLogicalType,
  isMapType,
  isOptional,
  isRecordType,
  LogicalType,
  MapType,
  RecordType,
  Type,
} from './model';

/** Convert a primitive type from avro to TypeScript */
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

interface State {
  output: string[];
  repository: { [key: string]: string };
  logicalTypes: { [key: string]: string };
}

export function avroTs(recordType: RecordType, logicalTypes: State['logicalTypes'] = {}): string {
  const state: State = { output: [], repository: {}, logicalTypes };

  convertRecord(recordType, state);
  return state.output.join('\n');
}

function convertRecord(recordType: RecordType, state: State): string {
  if (recordType.namespace) {
    state.repository[`${recordType.namespace}.${recordType.name}`] = recordType.name;
  }

  let buffer = `export interface ${recordType.name} {\n`;
  for (const field of recordType.fields) {
    buffer += convertFieldDec(field, state) + '\n';
  }
  buffer += '}\n';
  state.output.push(buffer);
  return recordType.name;
}

/** Convert an Avro Enum type. Return the name, but add the definition to the file */
function convertEnum(enumType: EnumType, state: State): string {
  const enumDef = `export enum ${enumType.name} { ${enumType.symbols.join(', ')} };\n`;
  state.output.push(enumDef);
  return enumType.name;
}

function convertLogicalType(type: LogicalType, state: State): string {
  return state.logicalTypes[type.logicalType] || convertPrimitive(type.type);
}

function convertPredefinedType(type: string, state: State): string {
  return state.repository[type];
}

function convertArrayType(type: Type[], state: State): string {
  return type.map(t => convertType(t, state)).join(' | ');
}

function convertMapType(type: MapType, state: State): string {
  return `{ [index:string]:${convertType(type.values, state)} }`;
}

function convertType(type: Type, state: State): string {
  if (typeof type === 'string') {
    return convertPredefinedType(type, state) || convertPrimitive(type) || type;
  } else if (type instanceof Array) {
    return convertArrayType(type, state);
  } else if (isLogicalType(type)) {
    return convertLogicalType(type, state);
  } else if (isRecordType(type)) {
    return convertRecord(type, state);
  } else if (isArrayType(type)) {
    return convertType(type.items, state) + '[]';
  } else if (isMapType(type)) {
    return convertMapType(type, state);
  } else if (isEnumType(type)) {
    return convertEnum(type, state);
  } else {
    throw new Error(`Cannot work out type ${type}`);
  }
}

function indent(text: string, prefix = '\t') {
  return text
    .split('\n')
    .map(row => `${prefix}${row}`)
    .join('\n');
}

function convertFieldDec(field: Field, state: State): string {
  const optional = isOptional(field.type) ? '?' : '';
  const doc = field.doc ? `/**\n* ${field.doc}\n*/\n` : '';

  return indent(`${doc}${field.name}${optional}: ${convertType(field.type, state)};`);
}
