/**** Contains the Interfaces and Type Guards for Avro schema */

export type Type = NameOrType | NameOrType[];
export type NameOrType = TypeNames | RecordType | ArrayType | NamedType | LogicalType;
export type TypeNames = 'record' | 'array' | 'null' | 'map' | string;

export interface Field {
  name: string;
  type: Type;
  doc?: string;
  default?: string | number | null | boolean;
}

export interface BaseType {
  type: TypeNames;
}

export interface RecordType extends BaseType {
  type: 'record';
  name: string;
  namespace?: string;
  doc?: string;
  fields: Field[];
}

export interface ArrayType extends BaseType {
  type: 'array';
  items: Type;
}

export interface MapType extends BaseType {
  type: 'map';
  values: Type;
}

export interface EnumType extends BaseType {
  type: 'enum';
  name: string;
  symbols: string[];
}

export interface LogicalType extends BaseType {
  logicalType: 'string';
}

export interface NamedType extends BaseType {
  type: string;
}
