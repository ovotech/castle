import { Context } from './types';
import { schema } from 'avsc';

export const fullName = (context: Context, schema: schema.RecordType): string =>
  `${schema.namespace ?? context.namespace}.${schema.name}`;
