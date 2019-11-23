import { retry } from 'ts-retry-promise';
import * as ansiRegex from 'ansi-regex';
import * as uuid from 'uuid';
import { Command } from 'commander';
import {
  Output,
  castleTopicCreate,
  castleTopicShow,
  castleTopicUpdate,
  castleTopicSearch,
  castleTopicMessage,
  castleTopicProduce,
  castleSchemaShow,
  castleTopicConsume,
  castleGroupShow,
  castleGroupUpdate,
} from '../src';
import { AvroKafka, SchemaRegistry } from '@ovotech/avro-kafkajs';
import { Kafka, logLevel, ResourceTypes } from 'kafkajs';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const topic1 = `dev_avroKafkajs_${uuid.v4()}`;
const topic2 = `dev_avroKafkajs_${uuid.v4()}`;
const groupId = `dev_avroKafkajs_${uuid.v4()}`;

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
  beforeEach(() => Promise.all([admin.connect(), consumer.connect()]));
  afterEach(() => Promise.all([admin.disconnect(), consumer.disconnect()]));

  it('Should process', async () => {
    jest.setTimeout(40000);
    // Create small topic
    // ================================================
    const createTopic1 = `topic create ${topic1}`;
    castleTopicCreate(new Command(), output).parse(createTopic1.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Creating topic "${topic1}"`);
        expect(logger.std).toContain(`Number of partitions | 1`);
        expect(logger.std).toContain(`Replication factor   | 1`);
        expect(logger.std).toContain(`Complete`);
        logger.clear();
      },
      { retries: 3, delay: 1000 },
    );

    // Create big topic
    // ================================================
    const createTopic2 = `topic create ${topic2} --num-partitions 3 --config-entry file.delete.delay.ms=40000`;
    castleTopicCreate(new Command(), output).parse(createTopic2.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Creating topic "${topic2}"`);
        expect(logger.std).toContain(`Number of partitions | 3`);
        expect(logger.std).toContain(`Replication factor   | 1`);
        expect(logger.std).toContain(`file.delete.delay.ms | 40000`);
        expect(logger.std).toContain(`Complete`);
        logger.clear();
      },
      { retries: 3, delay: 1000 },
    );

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
    const topicInfo2 = `topic info ${topic2}`;
    castleTopicShow(new Command(), output).parse(topicInfo2.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Topic "${topic2}"`);
        expect(logger.std).toContain(`file.delete.delay.ms                    | 40000`);
        logger.clear();
      },
      { retries: 3, delay: 1000 },
    );

    // Check topic-update works for big topic
    // ================================================
    const topicUpdate2 = `topic update ${topic2} --config-entry file.delete.delay.ms=50000`;
    castleTopicUpdate(new Command(), output).parse(topicUpdate2.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Updating topic "${topic2}"`);
        expect(logger.std).toContain(`file.delete.delay.ms | 50000`);
        expect(logger.std).toContain(`Complete`);
        logger.clear();
      },
      { retries: 3, delay: 1000 },
    );

    // Check config was updated
    // ================================================
    const configs = await admin.describeConfigs({
      includeSynonyms: false,
      resources: [{ type: ResourceTypes.TOPIC, name: topic2 }],
    });

    expect(configs.resources[0].configEntries).toContainEqual(
      expect.objectContaining({
        configName: 'file.delete.delay.ms',
        configValue: '50000',
      }),
    );

    // Check topics
    // ================================================
    const topics = `topic search ${topic2}`;
    castleTopicSearch(new Command(), output).parse(topics.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Topics containing "${topic2}"`);
        expect(logger.std).toContain(`${topic2} | 3          | 168 Hours         | delete`);
        logger.clear();
      },
      { retries: 3, delay: 1000 },
    );

    // Produce Ad-Hoc Messages
    // ================================================

    const topicMessages: any[] = [];
    await consumer.subscribe({ topic: topic1 });
    await consumer.subscribe({ topic: topic2 });
    await consumer.run({
      eachMessage: async ({ message }) => {
        topicMessages.push(message);
      },
    });

    const schemaFile = join(__dirname, 'schema1.json');
    const produceMessage1 = `topic message ${topic1} --schema-file ${schemaFile} --message {"field1":"other"}`;
    castleTopicMessage(new Command(), output).parse(produceMessage1.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Produce message in "${topic1}"`);
        expect(logger.std).toContain(`Success`);
        expect(topicMessages).toContainEqual(
          expect.objectContaining({ value: { field1: 'other' } }),
        );
        logger.clear();
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

    const produce2 = `topic produce ${produceFile}`;
    castleTopicProduce(new Command(), output).parse(produce2.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Produce "10" messages for ${topic2}`);
        expect(logger.std).toContain('Success');
        expect(topicMessages).toHaveLength(11);

        logger.clear();
      },
      { retries: 4, delay: 1000 },
    );

    await consumer.stop();
    consumer.disconnect();

    // Schema
    // ================================================

    const schema2 = `schema show ${topic2}`;
    castleSchemaShow(new Command(), output).parse(schema2.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Showing schema "${topic2}"`);
        expect(logger.std).toContain('Version 01');
        expect(logger.std).toContain(`
{ type: 'record',
  name: 'Event',
  fields: [ { name: 'field1', type: 'string' } ] }`);

        logger.clear();
      },
      { retries: 4, delay: 1000 },
    );

    // Consume
    // ================================================

    const consume2 = `topic consume ${topic2} --group-id ${groupId}`;
    castleTopicConsume(new Command(), output).parse(consume2.split(' '));

    await retry(
      async () => {
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
      },
      { retries: 8, delay: 1000 },
    );

    const groupShow = `group show ${groupId} ${topic2}`;
    castleGroupShow(new Command(), output).parse(groupShow.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Consumer group "${groupId}"`);
        expect(logger.std).toContain('Partition | Offset | Group Offset | Lag | Metadata');
        expect(logger.std).toContain('0         | 3      | 3            | 0   |');
        expect(logger.std).toContain('1         | 4      | 4            | 0   |');
        expect(logger.std).toContain('2         | 3      | 3            | 0   |');

        logger.clear();
      },
      { retries: 4, delay: 1000 },
    );

    const groupUpdate = `group update ${groupId} ${topic2} --reset-offsets latest`;
    castleGroupUpdate(new Command(), output).parse(groupUpdate.split(' '));

    await retry(
      async () => {
        expect(logger.std).toContain(`Success. Topic ${topic2} offsets reset to latest`);
        logger.clear();
      },
      { retries: 20, delay: 1000 },
    );
  });
});
