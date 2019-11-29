import { createCastle, produce, consumeEachMessage, consumeEachBatch } from '@ovotech/castle';
import {
  StartEvent,
  StartEventSchema,
  FeedbackEvent,
  FeedbackEventSchema,
  CompleteEvent,
  CompleteEventSchema,
} from './avro';

// Define multiple producers as pure functions
const sendStart = produce<StartEvent>({ topic: 'start-1', schema: StartEventSchema });
const sendComplete = produce<CompleteEvent>({ topic: 'complete-1', schema: CompleteEventSchema });
const sendFeedback = produce<FeedbackEvent>({ topic: 'feedback-1', schema: FeedbackEventSchema });

// Define a consumer as a pure function
const eachStartEvent = consumeEachMessage<StartEvent>(async ({ message }) => {
  console.log(`Started Processing ${message.value.id}`);
});

// Define a batch consumer as a pure function
const eachBatchFeedbackEvent = consumeEachBatch<FeedbackEvent>(async ({ batch, producer }) => {
  console.log(`Feedback ${batch.messages.map(msg => `${msg.value.id}:${msg.value.status}`)}`);
  console.log('Sending complete events');
  sendComplete(producer, batch.messages.map(msg => ({ value: { id: msg.value.id } })));
});

// Define a parallel consumer as a pure function
const eachCompleteEvent = consumeEachMessage<CompleteEvent>(async ({ message }) => {
  console.log(`Completed ${message.value.id}`);
});

const main = async () => {
  const castle = createCastle({
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: 'start-1',
        groupId: 'start-group-1',
        eachMessage: eachStartEvent,
      },
      {
        topic: 'feedback-1',
        groupId: 'feedback-group-1',
        eachBatch: eachBatchFeedbackEvent,
      },
      {
        topic: 'complete-1',
        groupId: 'complete-group-1',
        partitionsConsumedConcurrently: 2,
        eachMessage: eachCompleteEvent,
      },
    ],
  });

  await castle.start();

  // Perform a siqeunce of events
  // - send start events, wait a bit
  await sendStart(castle.producer, [{ value: { id: 10 } }, { value: { id: 20 } }]);

  // - wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // - send feedback events which would produce the complete events
  await sendFeedback(castle.producer, [
    { value: { id: 10, status: 'Sent' } },
    { value: { id: 20, status: 'Failed' } },
  ]);
};

main();
