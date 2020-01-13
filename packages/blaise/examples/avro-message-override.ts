import blaise from '@ovotech/blaise'

const schema: avsc.RecordType = {
  // [...]
};
const brewCoffee = blaise({
  avro: { schema },
  message: { value: { type: 'coffee' } },
});
brewCoffee.message({ value: { with: 'milk' } }); // {offset: 13, value {type: 'coffee', with: 'milk'}, [...]}

