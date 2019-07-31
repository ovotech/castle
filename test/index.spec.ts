import { schema } from 'avsc';
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { avroTs } from '../src';

const avscFiles = readdirSync(join(__dirname, 'avro'));

describe('Avro ts test', () => {
  beforeAll(() => {
    readdirSync(join(__dirname, '__generated__'))
      .filter(file => file.endsWith('.ts'))
      .forEach(file => unlinkSync(join(__dirname, '__generated__', file)));
  });

  it.each(avscFiles)('Should convert %s successfully', file => {
    const avro: schema.RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
    const ts = avroTs(avro, {
      'timestamp-millis': 'string',
      date: 'string',
      decimal: { import: "import { Decimal } from 'my-library'", type: 'Decimal' },
    });
    expect(ts).toMatchSnapshot();
    writeFileSync(join(__dirname, '__generated__', file + '.ts'), ts);
  });
});
