import blaise from '@ovotech/blaise'

const withAvro = blaise({ avro: { schema } });
const coffee = withAvro({ avro: { pickUnion: ['coffee'] } });
const tea = withAvro({ avro: { pickUnion: ['tea'] } });

coffee.getDefault(); // { avro: { schema, pickUnion: ['coffee']}}
tea.getDefault(); // { avro: { schema, pickUnion: ['tea']}}
