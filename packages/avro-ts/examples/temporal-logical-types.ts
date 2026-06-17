import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: 'record',
  name: 'Event',
  fields: [
    { name: 'eventDate', type: { type: 'int', logicalType: 'date' } },
    { name: 'startTimeMillis', type: { type: 'int', logicalType: 'time-millis' } },
    { name: 'startTimeMicros', type: { type: 'long', logicalType: 'time-micros' } },
    { name: 'createdAt', type: { type: 'long', logicalType: 'timestamp-millis' } },
    { name: 'createdAtMicros', type: { type: 'long', logicalType: 'timestamp-micros' } },
    { name: 'localCreatedAt', type: { type: 'long', logicalType: 'local-timestamp-millis' } },
    { name: 'localCreatedAtMicros', type: { type: 'long', logicalType: 'local-timestamp-micros' } },
    {
      name: 'elapsed',
      type: { type: 'fixed', name: 'Elapsed', size: 12, logicalType: 'duration' },
    },
  ],
};

// Temporal is a global as of Node 26+, so every avro date/time logical type can be mapped losslessly onto its
// semantic Temporal counterpart
const ts = toTypeScript(avro, {
  logicalTypes: {
    date: 'Temporal.PlainDate',
    'time-millis': 'Temporal.PlainTime',
    'time-micros': 'Temporal.PlainTime',
    'timestamp-millis': 'Temporal.Instant',
    'timestamp-micros': 'Temporal.Instant',
    // local-timestamp-* does not encode timezone, but also should not be assumed to be UTC (therefore not Instant)
    // PlainDateTime is probably the closest equivalent
    'local-timestamp-millis': 'Temporal.PlainDateTime',
    'local-timestamp-micros': 'Temporal.PlainDateTime',
    duration: 'Temporal.Duration',
  },
});

console.log(ts);
