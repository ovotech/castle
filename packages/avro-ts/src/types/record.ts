import { schema, Schema } from 'avsc';
import { Convert } from '../types';
import { Type, document, mapWithContext, withIdentifier, Node } from '@ovotech/ts-compose';
import { convertType, convertNamespace, firstUpperCase } from '../convert';

export const isRecordType = (type: Schema): type is schema.RecordType =>
  typeof type === 'object' && 'type' in type && type.type === 'record';

export const withDefault = (def: unknown, doc: string | undefined): string | undefined => {
  if (def === undefined) {
    return doc;
  }

  const defDoc = `Default: ${JSON.stringify(def)}`;

  return doc === undefined ? defDoc : `${doc}\n\n${defDoc}`;
};

export const convertRecordType: Convert<schema.RecordType> = (context, schema) => {
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

  const name = firstUpperCase(schema.name);
  const namespaceName = namespace ? convertNamespace(namespace) : undefined;
  const fullName = namespaceName ? [namespaceName, name] : name;

  const record = Type.Interface({
    name: firstUpperCase(schema.name),
    props: fields.items,
    isExport: true,
    jsDoc: schema.doc,
  });

  const contextWithRef = namespace
    ? withIdentifier(
        fields.context,
        Node.Const({
          name: `${name}Name`,
          isExport: true,
          value: `${namespace}.${schema.name}`,
        }),
        namespaceName,
      )
    : fields.context;

  return document(withIdentifier(contextWithRef, record, namespaceName), Type.Referance(fullName));
};
