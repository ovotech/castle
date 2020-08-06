import { toTypeScript, toExternalContext } from '@ovotech/avro-ts';
import { readFileSync } from 'fs';
import { join } from 'path';

const createUserSchema = JSON.parse(
  readFileSync(join(__dirname, 'external-CreateUser.json'), 'utf-8'),
);
const addressSchema = JSON.parse(readFileSync(join(__dirname, 'external-Address.json'), 'utf-8'));

const addressContext = toExternalContext(addressSchema);

const ts = toTypeScript(createUserSchema, { external: { './external-Address': addressContext } });

console.log(ts);
