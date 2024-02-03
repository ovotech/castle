import { schema, Type } from 'avsc';
import { toTypeScript } from '../src';

describe('Avro simple and full name related tests', () => {
  it.each<[string, { schema: schema.RecordType; testObject: unknown }]>([
    [
      'there are no namespaces',
      {
        schema: {
          type: 'record',
          name: 'RootRecord',
          fields: [
            {
              name: 'unionField',
              type: [
                {
                  type: 'record',
                  name: 'SomeRecordA',
                  fields: [
                    {
                      name: 'someRecordAField',
                      type: 'string',
                    },
                  ],
                },
                {
                  type: 'record',
                  name: 'SomeRecordB',
                  fields: [
                    {
                      name: 'someRecordBField',
                      type: 'string',
                    },
                  ],
                },
              ],
            },
          ],
        } as schema.RecordType,
        testObject: {
          unionField: {
            SomeRecordA: {
              someRecordAField: 'test',
            },
          },
        },
      },
    ],
    [
      'inheriting a namespace',
      {
        schema: {
          type: 'record',
          name: 'RootRecord',
          namespace: 'RootNamespace',
          fields: [
            {
              name: 'unionField',
              type: [
                {
                  type: 'record',
                  name: 'SomeRecordA',
                  fields: [
                    {
                      name: 'someRecordAField',
                      type: 'string',
                    },
                  ],
                },
                {
                  type: 'record',
                  name: 'SomeRecordB',
                  fields: [
                    {
                      name: 'someRecordBField',
                      type: 'string',
                    },
                  ],
                },
              ],
            },
          ],
        },
        testObject: {
          unionField: {
            ['RootNamespace.SomeRecordA']: {
              someRecordAField: 'test',
            },
          },
        },
      },
    ],
    [
      'specifying a full name',
      {
        schema: {
          type: 'record',
          name: 'RootRecord',
          fields: [
            {
              name: 'unionField',
              type: [
                {
                  type: 'record',
                  name: 'RecordANamespace.SomeRecordA',
                  fields: [
                    {
                      name: 'someRecordAField',
                      type: 'string',
                    },
                  ],
                },
                {
                  type: 'record',
                  name: 'RecordBNamespace.SomeRecordB',
                  fields: [
                    {
                      name: 'someRecordBField',
                      type: 'string',
                    },
                  ],
                },
              ],
            },
          ],
        },
        testObject: {
          unionField: {
            ['RecordANamespace.SomeRecordA']: {
              someRecordAField: 'test',
            },
          },
        },
      },
    ],
  ])('Should properly generate union type names when %s', (description, { schema, testObject }) => {
    const tsCode = toTypeScript(schema);

    const type = Type.forSchema(schema);
    const result = type.fromBuffer(type.toBuffer(testObject));

    // Adding the actual decoding result to visually make sure the types actually match the
    // avro decoder behavior.
    expect(result).toMatchSnapshot();
    expect(tsCode).toMatchSnapshot();
  });
});
