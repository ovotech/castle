import { createCastle, produce } from '../src';
import * as uuid from 'uuid';
import { Schema } from 'avsc';
import { logLevel } from 'kafkajs';

export interface Event1 {
  field1: string;
}

export const Event1Schema: Schema = {
  type: 'record',
  name: 'Event',
  fields: [{ name: 'field1', type: 'string' }],
};

const topic = `test-lifecycle-${uuid.v4()}`;

const sendEvent1 = produce<Event1>({ topic: topic, schema: Event1Schema });

const castle = createCastle({
  schemaRegistry: { uri: 'http://localhost:8081' },
  kafka: { brokers: ['localhost:29092'], logLevel: logLevel.NOTHING },
  consumers: [],
});

describe('Integration', () => {
  it('Should have lifecycle events', async () => {
    try {
      expect(castle.isRunning()).toBe(false);
      await castle.start();
      expect(castle.isRunning()).toBe(true);
      await castle.stop();
      expect(castle.isRunning()).toBe(false);
      await castle.start();
      await sendEvent1(castle.producer, [{ value: { field1: 'test3' }, key: null }]);
      expect(castle.isRunning()).toBe(true);
      await castle.stop();
      expect(castle.isRunning()).toBe(false);
    } finally {
      await castle.stop();
    }
  });
});
