import {
  idToSchema,
  schemaToId,
  getSubjects,
  getSubjectVersionSchema,
  getSubjectVersions,
} from '@ovotech/schema-registry-api';
import { Schema, Type, ForSchemaOptions } from 'avsc';

export interface AvroBuffer {
  id: number;
  buffer: Buffer;
}

export const deconstructMessage = (buffer: Buffer): AvroBuffer => {
  return { id: buffer.readInt32BE(1), buffer: buffer.slice(5) };
};

export const constructMessage = ({ id, buffer }: AvroBuffer): Buffer => {
  const prefix = Buffer.alloc(5);
  prefix.writeUInt8(0, 0);
  prefix.writeUInt32BE(id, 1);

  return Buffer.concat([prefix, buffer]);
};

export interface DecodeItem {
  type: Type;
  id: number;
}

export interface EncodeCache {
  get(id: number): Type | undefined;
  set(id: number, value: Type): unknown;
}
export interface DecodeCache {
  get(topic: string): DecodeItem | undefined;
  set(topic: string, value: DecodeItem): unknown;
}

export interface SchemaRegistryConfig {
  uri: string;
  options?: Partial<ForSchemaOptions>;
  encodeCache?: EncodeCache;
  decodeCache?: DecodeCache;
}

export class SchemaRegistry {
  private uri: string;
  private options?: Partial<ForSchemaOptions>;
  private encodeCache: EncodeCache;
  private decodeCache: DecodeCache;
  public constructor({
    uri,
    options,
    encodeCache = new Map<number, Type>(),
    decodeCache = new Map<string, DecodeItem>(),
  }: SchemaRegistryConfig) {
    this.uri = uri;
    this.options = options;
    this.encodeCache = encodeCache;
    this.decodeCache = decodeCache;
  }

  public async getSubjects(): Promise<string[]> {
    return await getSubjects(this.uri);
  }

  public async getSubjectVersions(subject: string): Promise<number[]> {
    return await getSubjectVersions(this.uri, subject);
  }

  public async getSubjectVersionSchema(subject: string, version: number): Promise<Schema> {
    return await getSubjectVersionSchema(this.uri, subject, version);
  }

  public async getType(id: number): Promise<Type> {
    const cached = this.encodeCache.get(id);
    if (cached) {
      return cached;
    } else {
      const schema = await idToSchema(this.uri, id);
      const type = Type.forSchema(schema, { registry: {}, ...this.options });
      this.encodeCache.set(id, type);
      return type;
    }
  }

  public async getDecodeItem(
    topic: string,
    schemaType: 'value' | 'key',
    schema: Schema,
  ): Promise<DecodeItem> {
    const subject = `${topic}-${schemaType}`;
    const cached = this.decodeCache.get(subject);
    if (cached) {
      return cached;
    } else {
      const id = await schemaToId(this.uri, subject, schema);
      const type = Type.forSchema(schema, { registry: {}, ...this.options });
      this.decodeCache.set(subject, { id, type });
      return { id, type };
    }
  }

  public async decode<T = unknown>(avroBuffer: Buffer): Promise<T> {
    const { value } = await this.decodeWithType(avroBuffer);
    return value;
  }

  public async decodeWithType<T = unknown>(avroBuffer: Buffer): Promise<{ value: T; type: Type }> {
    const { id, buffer } = deconstructMessage(avroBuffer);
    const type = await this.getType(id);
    const value = type.fromBuffer(buffer);
    return { type, value };
  }

  public async encode<T = unknown>(
    topic: string,
    schemaType: 'value' | 'key',
    schema: Schema,
    value: T,
  ): Promise<Buffer> {
    const { id, type } = await this.getDecodeItem(topic, schemaType, schema);
    return constructMessage({ id, buffer: type.toBuffer(value) });
  }
}
