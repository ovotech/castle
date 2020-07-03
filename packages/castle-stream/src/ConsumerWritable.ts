import { Writable } from 'stream';
import { AvroProducer, AvroEachBatchPayload } from '@ovotech/avro-kafkajs';
import { CastleStreamTopicSubscribe } from './types';
import { KafkaMessage } from 'kafkajs';

export class ConsumerWritable<TValue = unknown, TKey = KafkaMessage['key']> extends Writable {
  public constructor(
    public producer: AvroProducer,
    private subscribers: CastleStreamTopicSubscribe<TValue, TKey>,
  ) {
    super({ objectMode: true });
  }
  public async _write(
    data: AvroEachBatchPayload<TValue, TKey>,
    encoding: string,
    callback: (error?: Error | null) => void,
  ): Promise<void> {
    try {
      if ('eachBatch' in this.subscribers) {
        await this.subscribers.eachBatch({ ...data, producer: this.producer });
      } else {
        for (const message of data.batch.messages) {
          await this.subscribers.eachMessage({
            message,
            producer: this.producer,
            partition: data.batch.partition,
            topic: data.batch.topic,
          });
        }
      }
      callback();
    } catch (error) {
      callback(error);
    }
  }
}
