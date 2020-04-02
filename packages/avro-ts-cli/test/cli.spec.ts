import { readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { convert } from '../src';
import * as ansiRegex from 'ansi-regex';

class Logger {
  public std = '';
  public err = '';

  public log(line: string): void {
    this.std += line.replace(ansiRegex(), '') + '\n';
  }

  public error(line: string): void {
    this.err += line.replace(ansiRegex(), '') + '\n';
  }

  public clear(): void {
    this.std = '';
    this.err = '';
  }
}

const logger = new Logger();
const generatedDir = join(__dirname, '__generated__');
const avroDir = join(__dirname, 'avro');

describe('Cli', () => {
  beforeEach(() => {
    logger.clear();
    readdirSync(generatedDir)
      .filter((file) => file.endsWith('.ts'))
      .forEach((file) => unlinkSync(join(generatedDir, file)));

    readdirSync(avroDir)
      .filter((file) => file.endsWith('.ts'))
      .forEach((file) => unlinkSync(join(avroDir, file)));
  });

  it('Should convert single file', async () => {
    const input = `cmd avro-ts ${join(avroDir, 'ComplexRecord.avsc')}`;
    convert(logger).parse(input.split(' '));

    const file = readFileSync(join(avroDir, 'ComplexRecord.avsc.ts'), 'utf8');

    expect(logger.std).toMatchSnapshot();
    expect(file).toMatchSnapshot();
  });

  it('Should convert multiple files', async () => {
    const input1 = join(avroDir, 'ComplexRecord.avsc');
    const input2 = join(avroDir, 'ComplexUnionLogicalTypes.avsc');
    const input = `cmd avro-ts ${input1} ${input2}`;
    convert(logger).parse(input.split(' '));

    const file1 = readFileSync(join(avroDir, 'ComplexRecord.avsc.ts'), 'utf8');
    const file2 = readFileSync(join(avroDir, 'ComplexUnionLogicalTypes.avsc.ts'), 'utf8');

    expect(logger.std).toMatchSnapshot();
    expect(file1).toMatchSnapshot();
    expect(file2).toMatchSnapshot();
  });

  it('Should convert files into output folder file', async () => {
    const input1 = join(avroDir, 'ComplexRecord.avsc');
    const input2 = join(avroDir, 'ComplexUnionLogicalTypes.avsc');
    const input = `cmd avro-ts ${input1} ${input2} --output-dir ${generatedDir}`;
    convert(logger).parse(input.split(' '));

    const file1 = readFileSync(join(generatedDir, 'ComplexRecord.avsc.ts'), 'utf8');
    const file2 = readFileSync(join(generatedDir, 'ComplexUnionLogicalTypes.avsc.ts'), 'utf8');

    expect(logger.std).toMatchSnapshot();
    expect(file1).toMatchSnapshot();
    expect(file2).toMatchSnapshot();
  });

  it('Should convert files with logical types', async () => {
    const input1 = join(avroDir, 'ComplexRecord.avsc');
    const input2 = join(avroDir, 'ComplexUnionLogicalTypes.avsc');

    const input = `cmd avro-ts ${input1} ${input2} --output-dir ${generatedDir} --logical-type timestamp-millis=string --logical-type date=string`;
    convert(logger).parse(input.split(' '));

    const file1 = readFileSync(join(generatedDir, 'ComplexRecord.avsc.ts'), 'utf8');
    const file2 = readFileSync(join(generatedDir, 'ComplexUnionLogicalTypes.avsc.ts'), 'utf8');

    expect(logger.std).toMatchSnapshot();
    expect(file1).toMatchSnapshot();
    expect(file2).toMatchSnapshot();
  });

  it('Should convert files with logical types and imports', async () => {
    const input1 = join(avroDir, 'ComplexRecord.avsc');
    const input2 = join(avroDir, 'ComplexUnionLogicalTypes.avsc');

    const input = `cmd avro-ts ${input1} ${input2} --output-dir ${generatedDir} --logical-type-import date=Date:date.js --logical-type-import-default timestamp-millis=Timestamp:timestamp.js`;
    convert(logger).parse(input.split(' '));

    const file1 = readFileSync(join(generatedDir, 'ComplexRecord.avsc.ts'), 'utf8');
    const file2 = readFileSync(join(generatedDir, 'ComplexUnionLogicalTypes.avsc.ts'), 'utf8');

    expect(logger.std).toMatchSnapshot();
    expect(file1).toMatchSnapshot();
    expect(file2).toMatchSnapshot();
  });
});
