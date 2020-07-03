import { SchemaRegistry } from './SchemaRegistry';
import { Transaction, RecordMetadata, Offsets } from 'kafkajs';
import { AvroProducerRecord, AvroProducerBatch } from './types';
import { toProducerRecord, toProducerBatch } from './avro';

export class AvroTransaction {
  public constructor(public schemaRegistry: SchemaRegistry, public transaction: Transaction) {}

  public async send<T = unknown>(record: AvroProducerRecord<T>): Promise<RecordMetadata[]> {
    return this.transaction.send(await toProducerRecord(this.schemaRegistry, record));
  }

  public async sendBatch(batch: AvroProducerBatch): Promise<RecordMetadata[]> {
    return this.transaction.sendBatch(await toProducerBatch(this.schemaRegistry, batch));
  }

  public sendOffsets(offsets: Offsets & { consumerGroupId: string }): Promise<void> {
    return this.transaction.sendOffsets(offsets);
  }

  public commit(): Promise<void> {
    return this.transaction.commit();
  }

  public abort(): Promise<void> {
    return this.transaction.abort();
  }

  public isActive(): boolean {
    return this.transaction.isActive();
  }
}
