import { Type, Schema } from 'avsc';
import { AvroTimestampMillis } from '@ovotech/avro-timestamp-millis';

const eventSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    {
      name: 'field1',
      type: { type: 'long', logicalType: 'timestamp-millis' },
    },
  ],
};

const EventType = Type.forSchema(eventSchema, {
  logicalTypes: { 'timestamp-millis': AvroTimestampMillis },
});

const encoded = EventType.toBuffer({ field1: new Date('2020-01-01') });
const decoded = EventType.fromBuffer(encoded);

console.log(decoded);
