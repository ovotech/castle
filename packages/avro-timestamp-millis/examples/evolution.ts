import { Type, Schema } from 'avsc';
import { AvroTimestampMillis } from '@ovotech/avro-timestamp-millis';

const previousSchema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    {
      name: 'field1',
      type: { type: 'string' },
    },
  ],
};

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

const PreviousType = Type.forSchema(previousSchema);
const EventType = Type.forSchema(eventSchema, {
  logicalTypes: { 'timestamp-millis': AvroTimestampMillis },
});
const previousTypeResolver = EventType.createResolver(PreviousType);

const encoded = PreviousType.toBuffer({ field1: '2020-01-01' });
const decoded = EventType.fromBuffer(encoded, previousTypeResolver);

console.log(decoded);
