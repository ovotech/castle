import { readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

import { schema } from 'avsc';

import { toTypeScript } from '../src';

const avscFiles = readdirSync(join(__dirname, 'avro'));

describe('Avro ts test', () => {
  beforeAll(() => {
    readdirSync(join(__dirname, '__generated__'))
      .filter((file) => file.endsWith('.ts'))
      .forEach((file) => unlinkSync(join(__dirname, '__generated__', file)));
  });

  it.each(avscFiles)('Should convert %s successfully without namespaces', (file) => {
    const avro: schema.RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
    const ts = toTypeScript(avro, {
      logicalTypes: {
        'timestamp-millis': { module: 'moment', named: 'Moment' },
        date: 'string',
        decimal: { module: 'decimal.js', named: 'Decimal' },
      },
      ignoreNamespaces: true,
    });
    writeFileSync(join(__dirname, '__generated__', file + '.ts'), ts);
    expect(ts).toMatchSnapshot();
  });
});
