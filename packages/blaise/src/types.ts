import { AvroKafkaMessage } from '@ovotech/avro-kafkajs/dist/types';
import { Options as AvroOptions } from '@ovotech/avro-mock-generator';
import {
  CastleEachBatchPayload,
  CastleEachMessagePayload,
} from '@ovotech/castle';
import { schema } from 'avsc';
import { DeepOmit, DeepPartial } from 'ts-essentials';

export interface IBlaise<T = unknown> {
  <T1 = T>(newDefaults?: DeepPartial<BlaiseDefaults<T>>): IBlaise<T1>;
  default<T1 = T>(newDefaults: DeepPartial<BlaiseDefaults<T>>): IBlaise<T1>;
  pickUnion<T1 = T>(unions: Array<string>): IBlaise<T1>;

  getDefault(): BlaiseDefaults<T>;

  eachMessage(
    message?: DeepPartial<AvroKafkaMessage<T>>,
  ): CastleEachMessagePayload<T>;
  eachBatch(messages: Array<AvroKafkaMessage<T>>): CastleEachBatchPayload<T>;
  message(message?: DeepPartial<AvroKafkaMessage<T>>): AvroKafkaMessage<T>;
}

export type BlaiseDefaults<T = unknown> = {
  eachMessage: Omit<CastleEachMessagePayload<T>, 'message'>;
  eachBatch: DeepOmit<
    CastleEachBatchPayload<T>,
    { batch: { messages: never } }
  >;
  message: AvroKafkaMessage<T>;
  avro: AvroOptions & { schema: schema.AvroSchema };
};
