import { AvroTimestampMillis } from '../src';
import { Type } from 'avsc';

const IntType = Type.forSchema(
  {
    type: 'record',
    name: 'Event',
    fields: [{ name: 'field1', type: { type: 'long' } }],
  },
  {},
);

const StringType = Type.forSchema(
  {
    type: 'record',
    name: 'Event',
    fields: [{ name: 'field1', type: { type: 'string' } }],
  },
  {},
);

const TestType = Type.forSchema(
  {
    type: 'record',
    name: 'Event',
    fields: [{ name: 'field1', type: { type: 'long', logicalType: 'timestamp-millis' } }],
  },
  { logicalTypes: { 'timestamp-millis': AvroTimestampMillis } },
);

describe('Integration', () => {
  it('Should encode date correctly', async () => {
    const data = { field1: new Date('2020-01-01T00:00:00.000Z') };
    const encoded = TestType.toBuffer(data);
    const decoded = TestType.fromBuffer(encoded);

    expect(decoded.field1).toEqual(data.field1);
  });

  it('Should encode int correctly', async () => {
    const data = { field1: 1000000000000 };
    const encoded = TestType.toBuffer(data);
    const decoded = TestType.fromBuffer(encoded);

    expect(decoded.field1).toEqual(new Date('2001-09-09T01:46:40.000Z'));
  });

  it('Should load binary data', async () => {
    const data = { field1: 1000000000000 };
    const encoded = IntType.toBuffer(data);
    const decoded = TestType.fromBuffer(encoded);

    expect(decoded.field1).toEqual(new Date('2001-09-09T01:46:40.000Z'));
  });

  it('Should support schema evolution from string correctly', async () => {
    const data = { field1: '2020-01-01T00:00:00.000Z' };
    const encoded = StringType.toBuffer(data);
    const resolver = TestType.createResolver(StringType);
    const decoded = TestType.fromBuffer(encoded, resolver);

    expect(decoded.field1).toEqual(new Date('2020-01-01T00:00:00.000Z'));
  });
});
