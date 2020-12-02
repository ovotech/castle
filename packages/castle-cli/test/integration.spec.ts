import { retry } from 'ts-retry-promise';
import * as ansiRegex from 'ansi-regex';
import * as uuid from 'uuid';
import { Output, castle } from '../src';
import { AvroKafka, SchemaRegistry } from '@ovotech/avro-kafkajs';
import { Kafka, logLevel, ConfigResourceTypes } from 'kafkajs';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const topic1 = `test_topic1_${uuid.v4()}`;
const topic2 = `test_topic2_${uuid.v4()}`;
const config = `test_config_${uuid.v4()}`;
const groupId = `test_groupId_${uuid.v4()}`;

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
const output = new Output(logger, false);
const kafka = new AvroKafka(
  new SchemaRegistry({ uri: 'http://localhost:8081' }),
  new Kafka({ brokers: ['localhost:29092'], logLevel: logLevel.ERROR, clientId: 'testClient' }),
);
const admin = kafka.admin();
const consumer = kafka.consumer({ groupId: uuid.v4() });

describe('Integration', () => {
  it('Should process', async () => {
    jest.setTimeout(100000);

    await Promise.all([admin.connect(), consumer.connect()]);

    try {
      // Config set
      // ================================================
      const configSet1 = `node castle config set ${config} --schema-registry http://localhost:8081 --kafka-broker localhost:29092`;
      await castle(output).parseAsync(configSet1.split(' '));

      expect(logger.std).toContain(`Setting config "${config}"`);
      expect(logger.std).toContain(`Success`);
      logger.clear();

      // Config search
      // ================================================
      const configSearch1 = `node castle config search ${config}`;
      await castle(output).parseAsync(configSearch1.split(' '));

      expect(logger.std).toContain(`Searching for config "${config}"`);
      expect(logger.std).toContain(
        `${config} | Kafka: localhost:29092  SchemaRegistry: http://localhost:8081`,
      );
      logger.clear();

      // Config remove
      // ================================================
      const configRemove1 = `node castle config remove ${config}`;
      await castle(output).parseAsync(configRemove1.split(' '));

      expect(logger.std).toContain(`Removing config "${config}"`);
      expect(logger.std).toContain('Success');
      logger.clear();

      // Create small topic
      // ================================================
      const createTopic1 = `node castle topic create ${topic1}`;
      await castle(output).parseAsync(createTopic1.split(' '));

      expect(logger.std).toContain(`Creating topic "${topic1}"`);
      expect(logger.std).toContain(`Number of partitions | 1`);
      expect(logger.std).toContain(`Replication factor   | 1`);
      expect(logger.std).toContain(`Complete`);
      logger.clear();

      // Create big topic
      // ================================================
      const createTopic2 = `node castle topic create ${topic2} --num-partitions 3 --config-entry file.delete.delay.ms=40000`;
      await castle(output).parseAsync(createTopic2.split(' '));

      expect(logger.std).toContain(`Creating topic "${topic2}"`);
      expect(logger.std).toContain(`Number of partitions | 3`);
      expect(logger.std).toContain(`Replication factor   | 1`);
      expect(logger.std).toContain(`file.delete.delay.ms | 40000`);
      expect(logger.std).toContain(`Complete`);
      logger.clear();

      // Check topics actually created
      // ================================================
      const metadata = await admin.fetchTopicMetadata({ topics: [topic1, topic2] });

      expect(metadata.topics).toContainEqual({
        name: topic1,
        partitions: [expect.any(Object)],
      });

      expect(metadata.topics).toContainEqual({
        name: topic2,
        partitions: [expect.any(Object), expect.any(Object), expect.any(Object)],
      });

      // Check topic-info for big topic
      // ================================================
      const topicInfo2 = `node castle topic show ${topic2}`;
      await castle(output).parseAsync(topicInfo2.split(' '));

      expect(logger.std).toContain(`Topic "${topic2}"`);
      expect(logger.std).toContain(`file.delete.delay.ms                    | 40000`);
      logger.clear();

      // Check topic-update works for big topic
      // ================================================
      const topicUpdate2 = `node castle topic update ${topic2} --config-entry file.delete.delay.ms=50000`;
      await castle(output).parseAsync(topicUpdate2.split(' '));

      expect(logger.std).toContain(`Updating topic "${topic2}"`);
      expect(logger.std).toContain(`file.delete.delay.ms | 50000`);
      expect(logger.std).toContain(`Complete`);
      logger.clear();

      // Check config was updated
      // ================================================
      const configs = await admin.describeConfigs({
        includeSynonyms: false,
        resources: [{ type: ConfigResourceTypes.TOPIC, name: topic2 }],
      });

      expect(configs.resources[0].configEntries).toContainEqual(
        expect.objectContaining({
          configName: 'file.delete.delay.ms',
          configValue: '50000',
        }),
      );

      // Check topics
      // ================================================
      const topics = `node castle topic search ${topic2}`;
      await castle(output).parseAsync(topics.split(' '));

      expect(logger.std).toContain(`Topics containing "${topic2}"`);
      expect(logger.std).toContain(`${topic2} | 3          | 168 Hours         | delete`);
      logger.clear();

      // Produce Ad-Hoc Messages
      // ================================================

      const topicMessages: unknown[] = [];
      await consumer.subscribe({ topic: topic1 });
      await consumer.subscribe({ topic: topic2 });
      await consumer.run({
        eachMessage: async ({ message }) => {
          topicMessages.push(message);
        },
      });

      const schemaFile = join(__dirname, 'schema1.json');
      const keySchemaFile = join(__dirname, 'schema2.json');
      const produceMessage1 = `node castle topic message ${topic1} --schema-file ${schemaFile} --key-schema-file ${keySchemaFile} --message {"field1":"other"} --key {"id":11}`;
      await castle(output).parseAsync(produceMessage1.split(' '));

      expect(logger.std).toContain(`Produce message in "${topic1}"`);
      expect(logger.std).toContain(`Success`);
      logger.clear();

      await retry(
        async () => {
          expect(topicMessages).toContainEqual(
            expect.objectContaining({ value: { field1: 'other' } }),
          );
        },
        { retries: 4, delay: 1000 },
      );

      // Produce Messages
      // ================================================

      const produceTemplate = JSON.parse(
        readFileSync(join(__dirname, 'produce-template.json'), 'utf8'),
      );
      const produceFile = join(__dirname, '__generated__', 'produce-file.json');
      writeFileSync(produceFile, JSON.stringify({ ...produceTemplate, topic: topic2 }));

      const produce2 = `node castle topic produce ${produceFile}`;
      await castle(output).parseAsync(produce2.split(' '));

      expect(logger.std).toContain(`Produce "10" messages for ${topic2}`);
      expect(logger.std).toContain('Success');
      logger.clear();

      await retry(
        async () => {
          expect(topicMessages).toHaveLength(11);
        },
        { retries: 4, delay: 1000 },
      );

      await consumer.stop();
      consumer.disconnect();

      // Schema Search
      // ================================================

      const schemaSearch2 = `node castle schema search ${topic2}`;
      await castle(output).parseAsync(schemaSearch2.split(' '));

      expect(logger.std).toContain(`Searching for schemas "${topic2}"`);
      logger.clear();

      // Schema
      // ================================================

      const schema2 = `node castle schema show ${topic2}-value --depth 8`;
      await castle(output).parseAsync(schema2.split(' '));

      expect(logger.std).toContain(`Showing schema "${topic2}-value"`);
      expect(logger.std).toContain('Version 01');
      expect(logger.std).toContain("type: 'record'");
      expect(logger.std).toContain("name: 'Event'");
      expect(logger.std).toContain("fields: [ { name: 'field1', type: 'string' } ]");
      logger.clear();

      // Consume With Key
      // ================================================

      const consume1 = `node castle topic consume ${topic1} --group-id ${groupId} --encoded-key`;
      await castle(output).parseAsync(consume1.split(' '));

      expect(logger.std).toContain(`Consume "${topic1}"`);
      expect(logger.std).toContain('Key { id: 11 }');
      expect(logger.std).toContain("Event { field1: 'other' }");
      expect(logger.std).toContain('Success');

      logger.clear();

      // Consume
      // ================================================

      const consume2 = `node castle topic consume ${topic2} --group-id ${groupId}`;
      await castle(output).parseAsync(consume2.split(' '));

      expect(logger.std).toContain(`Consume "${topic2}"`);
      expect(logger.std).toContain('Partition 0 - Offsets 0...2 (100%)');
      expect(logger.std).toContain("Event { field1: 'test1' }");
      expect(logger.std).toContain("Event { field1: 'test4' }");
      expect(logger.std).toContain("Event { field1: 'test5' }");
      expect(logger.std).toContain('Partition 1 - Offsets 0...3 (100%)');
      expect(logger.std).toContain("Event { field1: 'test2' }");
      expect(logger.std).toContain("Event { field1: 'test6' }");
      expect(logger.std).toContain("Event { field1: 'test7' }");
      expect(logger.std).toContain("Event { field1: 'test8' }");
      expect(logger.std).toContain('Partition 2 - Offsets 0...2 (100%)');
      expect(logger.std).toContain("Event { field1: 'test3' }");
      expect(logger.std).toContain("Event { field1: 'test10' }");
      expect(logger.std).toContain("Event { field1: 'test11' }");
      expect(logger.std).toContain('Success');

      logger.clear();

      // Group Show
      // ================================================

      const groupShow = `node castle group show ${groupId} ${topic2}`;
      await castle(output).parseAsync(groupShow.split(' '));

      expect(logger.std).toContain(`Consumer group "${groupId}"`);
      expect(logger.std).toContain('Partition | Offset | Group Offset | Lag | Metadata');
      expect(logger.std).toContain('0         | 3      | 3            | 0   |');
      expect(logger.std).toContain('1         | 4      | 4            | 0   |');
      expect(logger.std).toContain('2         | 3      | 3            | 0   |');

      logger.clear();

      // Group Update Reset Offsets
      // ================================================

      const groupUpdate1 = `node castle group update ${groupId} ${topic2} --reset-offsets latest`;
      await castle(output).parseAsync(groupUpdate1.split(' '));

      expect(logger.std).toContain(`Success. Topic ${topic2} offsets reset to latest`);
      logger.clear();

      // Group Update Set Offsets
      // ================================================

      const groupUpdate2 = `node castle group update ${groupId} ${topic2} --set-offset 0=2 --set-offset 1=2`;
      await castle(output).parseAsync(groupUpdate2.split(' '));

      expect(logger.std).toContain(`Success. Topic ${topic2} offsets set`);
      expect(logger.std).toContain(`Partition | Offset`);
      expect(logger.std).toContain(`0         | 2`);
      expect(logger.std).toContain(`1         | 2`);
    } finally {
      await Promise.all([admin.disconnect(), consumer.disconnect()]);
    }
  });
});
