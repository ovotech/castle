import {
  createCastle,
  produce,
  consumeEachMessage,
  consumeEachBatch,
  describeCastle,
} from '@ovotech/castle';
import {
  StartEvent,
  StartEventSchema,
  FeedbackEvent,
  FeedbackEventSchema,
  CompleteEvent,
  CompleteEventSchema,
} from './avro';

enum Topic {
  Start = 'start',
  Complete = 'complete',
  Feedback = 'feedback',
}

// Define multiple producers as pure functions
const sendStart = produce<StartEvent>({ topic: Topic.Start, schema: StartEventSchema });
const sendComplete = produce<CompleteEvent>({ topic: Topic.Complete, schema: CompleteEventSchema });
const sendFeedback = produce<FeedbackEvent>({ topic: Topic.Feedback, schema: FeedbackEventSchema });

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
    // Setup topic aliases
    // You can use short statically checked names in the code,
    // but configure long environment specific kafka topic names
    topicsAlias: {
      [Topic.Start]: 'start-topic-name-1',
      [Topic.Feedback]: 'feedback-topic-name-1',
      [Topic.Complete]: 'complete-topic-name-1',
    },
    schemaRegistry: { uri: 'http://localhost:8081' },
    kafka: { brokers: ['localhost:29092'] },
    consumers: [
      {
        topic: Topic.Start,
        groupId: 'start-group-1',
        eachMessage: eachStartEvent,
      },
      {
        topic: Topic.Feedback,
        groupId: 'feedback-group-1',
        eachBatch: eachBatchFeedbackEvent,
      },
      {
        topic: Topic.Complete,
        groupId: 'complete-group-1',
        partitionsConsumedConcurrently: 2,
        eachMessage: eachCompleteEvent,
      },
    ],
  });

  await castle.start();

  console.log(describeCastle(castle));

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
