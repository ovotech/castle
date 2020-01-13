import blaise, { defaultPayload } from '../src';
import { schema as avsc } from 'avsc/types';

describe('Blaise', () => {
  beforeEach(jest.resetAllMocks);

  it('exposes a function', () => {
    expect(blaise).toBeDefined();
  });

  it('is a function returning default values', () => {
    expect(blaise.getDefault()).toEqual(defaultPayload);
    expect(blaise().getDefault()).toEqual(defaultPayload);
  });

  it('accepts values override', () => {
    expect(
      blaise({ eachMessage: { topic: 'a test' } }).getDefault().eachMessage,
    ).toEqual({
      ...defaultPayload.eachMessage,
      topic: 'a test',
    });
  });

  describe('default()', () => {
    it('deep merges over defaults', () => {
      expect(
        blaise({
          eachMessage: { partition: 1 },
        }).getDefault().eachMessage,
      ).toEqual({
        ...defaultPayload.eachMessage,
        partition: 1,
      });
    });

    it('does not override the previous defaults', () => {
      const blaise1 = blaise({ eachMessage: { topic: '1' } });
      const blaise2 = blaise1({ eachMessage: { topic: '2' } });
      expect(blaise1.getDefault().eachMessage).toEqual(
        expect.objectContaining({ topic: '1' }),
      );
      expect(blaise2.getDefault().eachMessage).toEqual(
        expect.objectContaining({ topic: '2' }),
      );
    });
  });

  describe('With Avro', () => {
    const schema: avsc.RecordType = {
      type: 'record',
      name: '',
      fields: [
        { name: 'added', type: 'string' },
        { name: 'anInt', type: 'int' },
      ],
    };

    const withAvro = blaise<{ added: string; anInt: number; notPass: boolean }>(
      {
        avro: {
          schema,
        },
      },
    );

    describe('message', () => {
      it('is able to generate a random message', () => {
        expect(withAvro.message().value).toEqual(
          expect.objectContaining({
            added: expect.any(String),
            anInt: expect.any(Number),
          }),
        );
      });

      it('allows overriding properties', () => {
        expect(withAvro.message({ value: { added: 'prop' } }).value).toEqual(
          expect.objectContaining({ added: 'prop' }),
        );
      });

      it('respects defaults', () => {
        expect(
          withAvro
            .default({ message: { value: { anInt: 12 } } })
            .message({ value: { added: 'prop' } }).value,
        ).toEqual(expect.objectContaining({ added: 'prop', anInt: 12 }));
      });
    });

    describe('eachMessage', () => {
      it('returns an eachMessagePayload', () => {
        // Test only message and a few other properties. TS has us sorted for the rest
        const payload = withAvro.eachMessage({ value: { added: 'prop' } });
        expect(payload).toEqual(
          expect.objectContaining({
            topic: expect.any(String),
          }),
        );
        expect(payload.message.value).toEqual(
          expect.objectContaining({ added: 'prop' }),
        );
      });
    });

    describe('eachPayload', () => {
      const mockMessage = withAvro.message;

      it('returns an eachMessagePayload', () => {
        // Test only message and a few other properties. TS has us sorted for the rest
        const payload = withAvro.eachBatch([mockMessage()]);
        const message = payload.batch.messages[0];
        expect(payload.batch.topic).toEqual(expect.any(String));
        expect(message.value).toEqual(
          expect.objectContaining({ added: expect.any(String) }),
        );
      });
    });

    describe('pickUnion', () => {
      const schema: avsc.RecordType = {
        type: 'record',
        name: '',
        fields: [
          {
            name: 'onion',
            type: [
              {
                type: 'record',
                name: 'gimmeAString',
                fields: [{ name: 'val', type: 'string' }],
              },
              {
                type: 'record',
                name: 'gimmeAnInt',
                fields: [{ name: 'val', type: 'int' }],
              },
            ],
          },
        ],
      };
      const union = blaise.default({ avro: { schema } });
      it('allows choosing union members', () => {
        expect(union.pickUnion(['gimmeAString']).message()).toHaveProperty(
          'value.onion.gimmeAString.val',
          expect.any(String),
        );
        expect(
          union
            .pickUnion<{ onion: { gimmeAnInt: { val: number } } }>([
              'gimmeAnInt',
            ])
            .message().value.onion.gimmeAnInt.val,
        ).toEqual(expect.any(Number));
      });
    });
  });
});
