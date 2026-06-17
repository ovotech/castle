import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { toTypeScript } from '../src';
import { toExternalContext } from '../src';

const avscFiles = readdirSync(join(__dirname, 'external-references')).filter((file) =>
  file.endsWith('.avsc'),
);
const experimentalDir = join(__dirname, '__generated__', 'experimental');

describe('Avro ts test', () => {
  beforeAll(() => {
    readdirSync(join(__dirname, '__generated__'))
      .filter((file) => file.endsWith('.external.ts'))
      .forEach((file) => unlinkSync(join(__dirname, '__generated__', file)));

    mkdirSync(experimentalDir, { recursive: true });
    readdirSync(experimentalDir)
      .filter((file) => file.endsWith('.external.ts'))
      .forEach((file) => unlinkSync(join(experimentalDir, file)));
  });

  it('Should convert %s successfully', () => {
    const external = avscFiles.reduce(
      (acc, file) => ({
        ...acc,
        [`./${file}.external`]: toExternalContext(
          JSON.parse(String(readFileSync(join(__dirname, 'external-references', file)))),
        ),
      }),
      {},
    );

    for (const file of avscFiles) {
      const ts = toTypeScript(
        JSON.parse(String(readFileSync(join(__dirname, 'external-references', file)))),
        { external },
      );
      writeFileSync(join(__dirname, '__generated__', file + '.external.ts'), ts);
      expect(ts).toMatchSnapshot(file);
    }
  });

  it('Should convert %s successfully using Typescript Enums', () => {
    const external = avscFiles.reduce(
      (acc, file) => ({
        ...acc,
        [`./${file}.external`]: toExternalContext(
          JSON.parse(String(readFileSync(join(__dirname, 'external-references', file)))),
        ),
      }),
      {},
    );

    for (const file of avscFiles) {
      const ts = toTypeScript(
        JSON.parse(String(readFileSync(join(__dirname, 'external-references', file)))),
        { external, withTypescriptEnums: true },
      );
      writeFileSync(join(__dirname, '__generated__', file + '.external.ts'), ts);
      expect(ts).toMatchSnapshot(file);
    }
  });

  // experimentalTypeOnlyNamespaces cannot be combined with withTypescriptEnums, so this variant
  // always runs in non-enum mode.
  it('Should convert %s successfully using experimental type only namespaces', () => {
    const external = avscFiles.reduce(
      (acc, file) => ({
        ...acc,
        [`./${file}.external`]: toExternalContext(
          JSON.parse(String(readFileSync(join(__dirname, 'external-references', file)))),
        ),
      }),
      {},
    );

    for (const file of avscFiles) {
      const ts = toTypeScript(
        JSON.parse(String(readFileSync(join(__dirname, 'external-references', file)))),
        { external, experimentalTypeOnlyNamespaces: true },
      );
      writeFileSync(join(experimentalDir, file + '.external.ts'), ts);
      expect(ts).toMatchSnapshot(file);
    }
  });
});
