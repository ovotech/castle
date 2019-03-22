import { User as ComplexRecord } from './__generated__/ComplexRecord.avsc';
import { AccountMigrationEvent as ComplexUnionLogicalTypes } from './__generated__/ComplexUnionLogicalTypes.avsc';
import { User as RecordWithEnum } from './__generated__/RecordWithEnum.avsc';
import { User as RecordWithInterface } from './__generated__/RecordWithInterface.avsc';
import { Event as RecordWithLogicalTypes } from './__generated__/RecordWithLogicalTypes.avsc';
import { User as RecordWithMap } from './__generated__/RecordWithMap.avsc';
import { User as RecordWithUnion } from './__generated__/RecordWithUnion.avsc';
import { User as SimpleRecord } from './__generated__/SimpleRecord.avsc';
import { TradeCollection } from './__generated__/TradeCollection.avsc';
import { User } from './__generated__/User.avsc';

const complexRecord: ComplexRecord = {
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

const complexUnionLogicalTypes: ComplexUnionLogicalTypes = {
  event: {
    'uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent': {
      metadata: {
        eventId: '123',
        traceToken: '123',
        createdAt: '2005-02-02',
      },
      enrollmentId: '123',
      accountId: '123',
      mpan: '123',
      effectiveEnrollmentDate: '123',
      cancelledAt: '123',
    },
  },
};

const recordWithEnum: RecordWithEnum = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  status: 'ACTIVE',
};

const recordWithInterface: RecordWithInterface = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  emailAddresses: [{ address: 'test@example.com', verified: true, dateAdded: 1233 }],
};

const recordWithLogicalTypes: RecordWithLogicalTypes = {
  id: 123,
  createdAt: '2009-02-02',
};

const recordwithMap: RecordWithMap = {
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

const recordWithUnion1: RecordWithUnion = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
};

const recordWithUnion2: RecordWithUnion = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  unionType: null,
};

const recordWithUnion3: RecordWithUnion = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
  unionType: 'test',
};

const simpleRecord: SimpleRecord = {
  id: 123,
  username: 'test',
  passwordHash: 'hkjas',
  signupDate: 112233,
};

const tradeCollection: TradeCollection = {
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
    },
  ],
};

const user: User = {
  id: 123,
  username: '123',
  passwordHash: '123',
  signupDate: 123,
  emailAddresses: [{ address: 'test@example.com', verified: true, dateAdded: 1233 }],
  twitterAccounts: [
    {
      status: 'ACTIVE',
      userId: 12,
      screenName: '123',
      oauthToken: 'adsasd',
      dateAuthorized: 123,
    },
  ],
  toDoItems: [
    {
      status: 'ACTIONABLE',
      title: '123',
      subItems: ['test'],
    },
  ],
};

// tslint:disable-next-line:no-console
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
);
