import * as ComplexRecord from './__generated__/ComplexRecord.avsc';
import * as ComplexUnionLogicalTypes from './__generated__/ComplexUnionLogicalTypes.avsc';
import * as RecordWithEnum from './__generated__/RecordWithEnum.avsc';
import * as RecordWithInterface from './__generated__/RecordWithInterface.avsc';
import * as RecordWithLogicalTypes from './__generated__/RecordWithLogicalTypes.avsc';
import * as RecordWithMap from './__generated__/RecordWithMap.avsc';
import * as RecordWithUnion from './__generated__/RecordWithUnion.avsc';
import * as SimpleRecord from './__generated__/SimpleRecord.avsc';
import * as TradeCollection from './__generated__/TradeCollection.avsc';
import * as User from './__generated__/User.avsc';
import * as moment from 'moment';

const complexRecord: ComplexRecord.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  mapField: {
    test: {
      label: '112233',
    },
  },
  emailAddresses: [{ address: 'test@example.com', verified: true, dateAdded: 1233 }],
  status: 'ACTIVE',
};

const complexUnionLogicalTypes: ComplexUnionLogicalTypes.AccountMigrationEvent = {
  event: {
    [ComplexUnionLogicalTypes.AccountMigrationCancelledEventName]: {
      metadata: {
        eventId: '123',
        traceToken: '123',
        createdAt: moment('2005-02-02'),
      },
      enrollmentId: '123',
      accountId: '123',
      mpan: '123',
      effectiveEnrollmentDate: '123',
      cancelledAt: moment(),
    },
  },
};

const recordWithEnum: RecordWithEnum.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  status: 'ACTIVE',
};

const recordWithInterface: RecordWithInterface.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  emailAddresses: [{ address: 'test@example.com', verified: true, dateAdded: 1233 }],
};

const recordWithLogicalTypes: RecordWithLogicalTypes.Event = {
  id: 123,
  createdAt: moment('2009-02-02'),
};

const recordwithMap: RecordWithMap.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  mapField: {
    test: {
      label: '112233',
    },
  },
};

const recordWithUnion1: RecordWithUnion.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  unionType: null,
};

const recordWithUnion2: RecordWithUnion.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  unionType: null,
};

const recordWithUnion3: RecordWithUnion.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  unionType: 'test',
};

const simpleRecord: SimpleRecord.User = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
};

const tradeCollection: TradeCollection.TradeCollection = {
  producerId: '123',
  exchange: '123',
  market: '123',
  trades: [
    {
      id: '123',
      price: 123,
      amount: 123,
      datetime: '123',
      timestamp: 123,
      type: 'Market',
      side: 'Buy',
    },
    {
      id: '123',
      price: 123,
      amount: 123,
      datetime: '123',
      timestamp: 123,
      type: 'Limit',
      side: null,
    },
  ],
};

const user: User.User = {
  id: 123,
  username: '123',
  passwordHash: '123',
  signupDate: 123,
  emailAddresses: [
    { address: 'test@example.com', verified: true, dateAdded: 1233, dateBounced: null },
  ],
  twitterAccounts: [
    {
      status: 'ACTIVE',
      userId: 12,
      screenName: '123',
      oauthToken: 'adsasd',
      dateAuthorized: 123,
      oauthTokenSecret: null,
    },
  ],
  toDoItems: [
    {
      status: 'ACTIONABLE',
      title: '123',
      subItems: [
        {
          status: 'DELETED',
          title: '222',
          description: null,
          snoozeDate: null,
          subItems: [],
        },
      ],
      description: null,
      snoozeDate: null,
    },
  ],
};

console.log(
  complexRecord,
  complexUnionLogicalTypes,
  recordWithEnum,
  recordWithInterface,
  recordWithLogicalTypes,
  recordwithMap,
  recordWithUnion1,
  recordWithUnion2,
  recordWithUnion3,
  simpleRecord,
  tradeCollection,
  user,
  complexUnionLogicalTypes.event[ComplexUnionLogicalTypes.AccountMigrationCancelledEventName],
);
