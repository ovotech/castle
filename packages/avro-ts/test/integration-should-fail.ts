/* Use this files to test that failures are happening
   as they should
 */
import { UkCoBoostpowerSupportKafkaMessages as Messages } from './__generated__/ComplexUnionLogicalTypes.avsc';
import * as moment from 'moment';

const complexUnionLogicalTypes: Messages.AccountMigrationEvent = {
  event: {
    [Messages.AccountMigrationCancelledEventName]: /* should fail */ {
      metadata: {
        eventId: '123',
        traceToken: '123',
        // createdAt type is Moment
        // @ts-expect-error testing a fail case failing
        createdAt: '123',
      },
      enrollmentId: '123',
      accountId: '123',
      mpan: '123',
      effectiveEnrollmentDate: '123',
      cancelledAt: moment(),
    },
  },
};

function isAccountMigrationCancelled(
  msg: Messages.AccountMigrationEvent,
): msg is Messages.AccountMigrationEvent & { event: Messages.AccountMigrationEvent['event'] } {
  return !!msg.event[Messages.AccountMigrationCancelledEventName];
}

if (isAccountMigrationCancelled(complexUnionLogicalTypes)) {
  // @ts-expect-error testing a fail case failing
  // .wat does not exist
  complexUnionLogicalTypes.event[Messages.AccountMigrationCancelledEventName].wat; // should fail
  // Our type is AccountMigrationCancelled, not AccountMigrationScheduled
  // even though AccountMigrationScheduled has a `scheduledAt` property.
  // @ts-expect-error testing a fail case failing
  complexUnionLogicalTypes.event[Messages.AccountMigrationScheduledEventName].scheduledAt; // should fail
}
