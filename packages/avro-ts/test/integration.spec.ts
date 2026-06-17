import { schema } from 'avsc';
import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { toTypeScript } from '../src';

const avscFiles = readdirSync(join(__dirname, 'avro'));
const experimentalDir = join(__dirname, '__generated__', 'experimental');

describe('Avro ts test', () => {
  beforeAll(() => {
    readdirSync(join(__dirname, '__generated__'))
      .filter((file) => file.endsWith('.ts'))
      .forEach((file) => unlinkSync(join(__dirname, '__generated__', file)));

    mkdirSync(experimentalDir, { recursive: true });
    readdirSync(experimentalDir)
      .filter((file) => file.endsWith('.ts'))
      .forEach((file) => unlinkSync(join(experimentalDir, file)));
  });

  it.each(avscFiles)('Should convert %s successfully', (file) => {
    const avro: schema.RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
    const ts = toTypeScript(avro, {
      logicalTypes: {
        'timestamp-millis': { module: 'moment', named: 'Moment' },
        date: 'string',
        decimal: { module: 'decimal.js', named: 'Decimal' },
      },
    });
    writeFileSync(join(__dirname, '__generated__', file + '.ts'), ts);
    expect(ts).toMatchSnapshot();
  });

  it.each(avscFiles)('Should convert %s successfully using Typescript Enums', (file) => {
    const avro: schema.RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
    const ts = toTypeScript(avro, {
      withTypescriptEnums: true,
      logicalTypes: {
        'timestamp-millis': { module: 'moment', named: 'Moment' },
        date: 'string',
        decimal: { module: 'decimal.js', named: 'Decimal' },
      },
    });
    writeFileSync(join(__dirname, '__generated__', file + '.ts'), ts);
    expect(ts).toMatchSnapshot();
  });

  it.each(avscFiles)('Should convert %s successfully with default as optional', (file) => {
    const avro: schema.RecordType = JSON.parse(String(readFileSync(join(__dirname, 'avro', file))));
    const ts = toTypeScript(avro, {
      logicalTypes: {
        'timestamp-millis': { module: 'moment', named: 'Moment' },
        date: 'string',
        decimal: { module: 'decimal.js', named: 'Decimal' },
      },
      defaultsAsOptional: true,
    });
    writeFileSync(join(__dirname, '__generated__', file + '.ts'), ts);
    expect(ts).toMatchSnapshot();
  });

  it.each(avscFiles)(
    'Should convert %s successfully using experimental type only namespaces',
    (file) => {
      const avro: schema.RecordType = JSON.parse(
        String(readFileSync(join(__dirname, 'avro', file))),
      );
      const ts = toTypeScript(avro, {
        experimentalTypeOnlyNamespaces: true,
        logicalTypes: {
          'timestamp-millis': { module: 'moment', named: 'Moment' },
          date: 'string',
          decimal: { module: 'decimal.js', named: 'Decimal' },
        },
      });
      writeFileSync(join(experimentalDir, file + '.ts'), ts);
      expect(ts).toMatchSnapshot();
    },
  );
});
