import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { convertCommand } from '../src';

const generatedDir = join(__dirname, '__generated__');
const avroDir = join(__dirname, 'avro');

describe('Cli', () => {
  beforeEach(() => {
    readdirSync(generatedDir)
      .filter(file => file.endsWith('.ts'))
      .forEach(file => unlinkSync(join(generatedDir, file)));

    readdirSync(avroDir)
      .filter(file => file.endsWith('.ts'))
      .forEach(file => unlinkSync(join(avroDir, file)));
  });

  it('Should convert single file', async () => {
    await convertCommand.handler({
      _: [],
      $0: '',
      input: [join(avroDir, 'ComplexRecord.avsc')],
      'output-dir': '',
      'logical-type': [],
      'logical-type-import': [],
    });

    const file = readFileSync(join(avroDir, 'ComplexRecord.avsc.ts'));
    expect(String(file)).toMatchSnapshot();
  });

  it('Should convert multiple files', async () => {
    await convertCommand.handler({
      _: [],
      $0: '',
      input: [join(avroDir, 'ComplexRecord.avsc'), join(avroDir, 'ComplexUnionLogicalTypes.avsc')],
      'output-dir': '',
      'logical-type': [],
      'logical-type-import': [],
    });

    const file1 = readFileSync(join(avroDir, 'ComplexRecord.avsc.ts'));
    const file2 = readFileSync(join(avroDir, 'ComplexUnionLogicalTypes.avsc.ts'));
    expect(String(file1)).toMatchSnapshot();
    expect(String(file2)).toMatchSnapshot();
  });

  it('Should convert files into output folder file', async () => {
    await convertCommand.handler({
      _: [],
      $0: '',
      input: [join(avroDir, 'ComplexRecord.avsc'), join(avroDir, 'ComplexUnionLogicalTypes.avsc')],
      'output-dir': generatedDir,
      'logical-type': [],
      'logical-type-import': [],
    });

    const file1 = readFileSync(join(generatedDir, 'ComplexRecord.avsc.ts'));
    const file2 = readFileSync(join(generatedDir, 'ComplexUnionLogicalTypes.avsc.ts'));
    expect(String(file1)).toMatchSnapshot();
    expect(String(file2)).toMatchSnapshot();
  });

  it('Should convert files with logical types', async () => {
    await convertCommand.handler({
      _: [],
      $0: '',
      input: [join(avroDir, 'ComplexRecord.avsc'), join(avroDir, 'ComplexUnionLogicalTypes.avsc')],
      'output-dir': generatedDir,
      'logical-type': ['timestamp-millis=string', 'date=string'],
      'logical-type-import': [],
    });

    const file1 = readFileSync(join(generatedDir, 'ComplexRecord.avsc.ts'));
    const file2 = readFileSync(join(generatedDir, 'ComplexUnionLogicalTypes.avsc.ts'));
    expect(String(file1)).toMatchSnapshot();
    expect(String(file2)).toMatchSnapshot();
  });

  it('Should convert files with logical types and imports', async () => {
    await convertCommand.handler({
      _: [],
      $0: '',
      input: [join(avroDir, 'ComplexRecord.avsc'), join(avroDir, 'ComplexUnionLogicalTypes.avsc')],
      'output-dir': generatedDir,
      'logical-type': ['date=Decimal'],
      'logical-type-import': ["date=import { Decimal } from 'decimal.js'"],
    });

    const file2 = readFileSync(join(generatedDir, 'ComplexUnionLogicalTypes.avsc.ts'));
    expect(String(file2)).toMatchSnapshot();
  });

  it('Should check for generated folder', async () => {
    const result = convertCommand.handler({
      _: [],
      $0: '',
      input: [join(avroDir, 'ComplexRecord.avsc')],
      'output-dir': 'unknown-folder',
      'logical-type': [],
      'logical-type-import': [],
    });

    await expect(result).rejects.toMatchObject({
      message: "ENOENT: no such file or directory, open 'unknown-folder/ComplexRecord.avsc.ts'",
    });
  });
});
