import { Type, Schema } from 'avsc';
import { AvroEpochDays } from '@ovotech/avro-epoch-days';

const eventSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    {
      name: 'field1',
      type: { type: 'int', logicalType: 'date' },
    },
  ],
};

const EventType = Type.forSchema(eventSchema, { logicalTypes: { date: AvroEpochDays } });

const encoded = EventType.toBuffer({ field1: new Date('2020-01-01') });
const decoded = EventType.fromBuffer(encoded);

console.log(decoded);
