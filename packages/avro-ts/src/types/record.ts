import { schema as avroSchema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type, document, mapWithContext } from '@ovotech/ts-compose';
import { convertType } from '../convert';
import { firstUpperCase, namedType } from '../helpers';

export const isRecordType = (type: Schema): type is avroSchema.RecordType =>
  (typeof type === 'object' && 'type' in type && type.type === 'record') ||
  (type as any).type === 'error';

export const withDefault = (def: unknown, doc: string | undefined): string | undefined => {
  if (def === undefined) {
    return doc;
  }

  const defDoc = `Default: ${JSON.stringify(def)}`;

  return doc === undefined ? defDoc : `${doc}\n\n${defDoc}`;
};

export const convertRecordType: Convert<avroSchema.RecordType> = (context, schema) => {
  const namespace = schema.namespace ?? context.namespace;

  const fields = mapWithContext(
    context,
    schema.fields,
    (fieldContext, { name, type, doc, default: def }) => {
      const converted = convertType({ ...fieldContext, namespace }, type);

      return document(
        converted.context,
        Type.Prop({
          name,
          type: converted.type,
          jsDoc: withDefault(def, doc),
          isOptional: converted.context.defaultsAsOptional && def !== undefined,
        }),
      );
    },
  );

  const record = Type.Interface({
    name: firstUpperCase(schema.name),
    props: fields.items,
    isExport: true,
    jsDoc: schema.doc,
  });

  return namedType(record, fields.context, schema, namespace);
};
