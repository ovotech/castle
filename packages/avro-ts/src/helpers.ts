import { Context } from './types';
import { schema as avroSchema } from 'avsc';

export const fullName = (context: Context, schema: avroSchema.RecordType): string =>
  `${schema.namespace ?? context.namespace}.${schema.name}`;
