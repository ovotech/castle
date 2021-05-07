import {
  idToSchema,
  schemaToId,
  getSubjects,
  getSubjectVersion,
  getSubjectVersionSchema,
  getSubjectVersions,
} from '@ovotech/schema-registry-api';
import { Schema, Type, ForSchemaOptions } from 'avsc';
import { isDeepStrictEqual } from 'util';

export interface AvroBuffer {
  id: number;
  buffer: Buffer;
}

export interface SchemaVersion {
  subject: string;
  id: number;
  version: number;
  schema: string;
}

const magicByte = Buffer.alloc(1);
const defaultOffset = 0;

export const deconstructMessage = (buffer: Buffer): AvroBuffer => {
  return { id: buffer.slice(1, 5).readInt32BE(defaultOffset), buffer: buffer.slice(5) };
};

export const constructMessage = ({ id, buffer }: AvroBuffer): Buffer => {
  const idBytes = Buffer.alloc(4);
  idBytes.writeUInt32BE(id, defaultOffset);

  return Buffer.concat([magicByte, idBytes, buffer]);
};

export interface DecodeItem {
  type: Type;
  id: number;
}

export interface EncodeCache {
  get(id: number): Type | undefined;
  set(id: number, value: Type): unknown;
}

export interface DecodeCacheKey {
  subject: string;
  schema?: Schema;
}

export interface DecodeCache {
  get(cacheKey: DecodeCacheKey): DecodeItem | undefined;
  set(cacheKey: DecodeCacheKey, value: DecodeItem): unknown;
}

export interface SchemaRegistryConfig {
  uri: string;
  options?: Partial<ForSchemaOptions>;
  encodeCache?: EncodeCache;
  decodeCache?: DecodeCache;
}

export type DecodeItemParams =
  | { topic: string; schemaType: 'value' | 'key'; schema: Schema }
  | { subject: string };

export type EncodeParams<T> = { value: T } & DecodeItemParams;

export class DecodeCacheInMemory<KeyType, ValueType> {
  private cache: Array<[KeyType, ValueType]> = [];
  public get(cacheKey: KeyType): ValueType | undefined {
    return this.cache.find((item) => isDeepStrictEqual(item[0], cacheKey))?.[1];
  }
  public set(cacheKey: KeyType, value: ValueType): void {
    this.cache.push([cacheKey, value]);
  }
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
    decodeCache = new DecodeCacheInMemory<DecodeCacheKey, DecodeItem>(),
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

  public async getSubjectVersion(subject: string, version: number): Promise<SchemaVersion> {
    return await getSubjectVersion(this.uri, subject, version);
  }

  public async getSubjectVersionSchema(subject: string, version: number): Promise<Schema> {
    return await getSubjectVersionSchema(this.uri, subject, version);
  }

  public async getSubjectLastVersionSchema(subject: string): Promise<Schema> {
    const versions = await getSubjectVersions(this.uri, subject);
    const latestVersion = versions[versions.length - 1];
    return await getSubjectVersionSchema(this.uri, subject, latestVersion);
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

  public async getDecodeItem(params: DecodeItemParams): Promise<DecodeItem> {
    const cacheKey: DecodeCacheKey =
      'subject' in params
        ? { subject: params.subject }
        : { subject: `${params.topic}-${params.schemaType}`, schema: params.schema };

    const cached = this.decodeCache.get(cacheKey);
    if (cached) {
      return cached;
    } else {
      const schema =
        'subject' in params
          ? await this.getSubjectLastVersionSchema(params.subject)
          : params.schema;

      const id = await schemaToId(this.uri, cacheKey.subject, schema);
      const type = Type.forSchema(schema, { registry: {}, ...this.options });
      this.decodeCache.set(cacheKey, { id, type });
      return { id, type };
    }
  }

  public async decode<T = unknown>(avroBuffer: Buffer): Promise<T> {
    const { value } = await this.decodeWithType<T>(avroBuffer);
    return value;
  }

  public async decodeWithType<T = unknown>(avroBuffer: Buffer): Promise<{ value: T; type: Type }> {
    const { id, buffer } = deconstructMessage(avroBuffer);
    const type = await this.getType(id);
    const value = type.fromBuffer(buffer);
    return { type, value };
  }

  public async encode<T = unknown>(params: EncodeParams<T>): Promise<Buffer> {
    const { value, ...decodeOptions } = params;
    const { id, type } = await this.getDecodeItem(decodeOptions);
    return constructMessage({ id, buffer: type.toBuffer(value) });
  }
}
