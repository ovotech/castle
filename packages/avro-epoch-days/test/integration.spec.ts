import { AvroEpochDays } from '../src';
import { Type } from 'avsc';

const IntType = Type.forSchema(
  {
    type: 'record',
    name: 'Event',
    fields: [{ name: 'field1', type: { type: 'int' } }],
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
    fields: [{ name: 'field1', type: { type: 'int', logicalType: 'date' } }],
  },
  { logicalTypes: { date: AvroEpochDays } },
);

describe('Integration', () => {
  it('Should encode date correctly', async () => {
    const data = { field1: new Date('2020-01-01T00:00:00.000Z') };
    const encoded = TestType.toBuffer(data);
    const decoded = TestType.fromBuffer(encoded);

    expect(decoded.field1).toEqual(data.field1);
  });

  it('Should encode int correctly', async () => {
    const data = { field1: 17687 };
    const encoded = TestType.toBuffer(data);
    const decoded = TestType.fromBuffer(encoded);

    expect(decoded.field1).toEqual(new Date('2018-06-05T00:00:00.000Z'));
  });

  it('Should load binary data', async () => {
    const data = { field1: 10000 };
    const encoded = IntType.toBuffer(data);
    const decoded = TestType.fromBuffer(encoded);

    expect(decoded.field1).toEqual(new Date('1997-05-19T00:00:00.000Z'));
  });

  it('Should support schema evolution from string correctly', async () => {
    const data = { field1: '2020-01-01T00:00:00.000Z' };
    const encoded = StringType.toBuffer(data);
    const resolver = TestType.createResolver(StringType);
    const decoded = TestType.fromBuffer(encoded, resolver);

    expect(decoded.field1).toEqual(new Date('2020-01-01T00:00:00.000Z'));
  });
});
