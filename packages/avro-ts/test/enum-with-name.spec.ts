import { schema } from 'avsc';
import { toTypeScript } from '../src';

// For more info on why this text exists, see https://github.com/ovotech/castle/issues/126
describe('enum with "Name" name in name', () => {
  it('actually generates a union type when transforming an enum with "name" in the name', () => {
    const schema = {
      type: 'record',
      name: 'Status',
      namespace: 'com.example.avro',
      fields: [
        {
          name: 'statusName',
          type: {
            type: 'enum',
            name: 'StatusName',
            symbols: ['ACTIVE', 'INACTIVE'],
          },
        },
      ],
    } as schema.RecordType;

    const tsCode = toTypeScript(schema);

    expect(tsCode).toEqual(`/* eslint-disable @typescript-eslint/no-namespace */

export type Status = ComExampleAvro.Status;

export namespace ComExampleAvro {
    export const StatusNameSchema = ${JSON.stringify(JSON.stringify(schema.fields[0].type))};
    export const StatusNameName = "com.example.avro.StatusName";
    export type StatusName = "ACTIVE" | "INACTIVE";
    export const ComExampleAvroStatusSchema = ${JSON.stringify(JSON.stringify(schema))};
    export const ComExampleAvroStatusName = "com.example.avro.Status";
    export interface Status {
        statusName: ComExampleAvro.StatusName;
    }
}
`);
  });
});
