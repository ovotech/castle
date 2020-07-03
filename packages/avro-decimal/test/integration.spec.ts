import { Type } from 'avsc';
import { Decimal } from 'decimal.js';
import { bufferToDecimal, decimalToBuffer, to64Bit, AvroDecimal } from '../src';

export const decimalSchema = Type.forSchema(
  {
    type: 'bytes',
    logicalType: 'decimal',
    precision: 16,
    scale: 8,
  },
  {
    logicalTypes: { decimal: AvroDecimal },
  },
);

describe('DecimalSchema', () => {
  it('can serialise/deserialise a decimal', () => {
    const d = new Decimal('100.01');
    expect(d).toEqual(decimalSchema.fromBuffer(decimalSchema.toBuffer(d)));
  });

  it('truncates decimals with greater scale', () => {
    const d = new Decimal('99999999.999999999');
    expect(new Decimal('99999999.99999999')).toEqual(
      decimalSchema.fromBuffer(decimalSchema.toBuffer(d)),
    );
  });
});

describe('to64Bit', () => {
  it('correctly converts the buffer for a positive number to a 64bit one', () => {
    // buffer for number 1
    const input = Buffer.from([0x01]);

    expect(
      to64Bit(input).equals(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01])),
    ).toBe(true);
  });

  it('correctly converts the buffer for a negative number to a 64bit one', () => {
    // buffer for number -1
    const input = Buffer.from([0xff]);

    expect(
      to64Bit(input).equals(Buffer.from([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff])),
    ).toBe(true);
  });
});

describe('bufferToDecimal', () => {
  it('converts any <= 8byte buffer to a decimal', () => {
    const testOneBuffers = [
      Buffer.from([0x01]),
      Buffer.from([0x00, 0x01]),
      Buffer.from([0x00, 0x00, 0x01]),
      Buffer.from([0x00, 0x00, 0x00, 0x01]),
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x01]),
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
    ];

    testOneBuffers.forEach((b) => {
      expect(bufferToDecimal(b, 0).equals('1')).toBe(true);
      expect(bufferToDecimal(b, 4).equals('0.0001')).toBe(true);
    });
  });
});

describe('decimalToBuffer', () => {
  it('converts any decimal to an 8byte buffer', () => {
    expect(
      decimalToBuffer(new Decimal('1'), 0).equals(
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      ),
    ).toBe(true);
    expect(
      decimalToBuffer(new Decimal('0.0001'), 4).equals(
        Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]),
      ),
    ).toBe(true);
  });
});
