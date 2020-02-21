/* Use this files to test that failures are happening
   as they should
 */
import {
  Names as AccountNames,
  AccountMigrationEvent as ComplexUnionLogicalTypes,
  NamespacedAccountMigrationCancelledEvent,
} from './__generated__/ComplexUnionLogicalTypes.avsc';

// @ts-ignore we don't need the real data for our test
const complexUnionLogicalTypes: AccountMigrationEvent = {};

function isAccountMigrationCancelled(
  msg: ComplexUnionLogicalTypes,
): msg is ComplexUnionLogicalTypes & { event: NamespacedAccountMigrationCancelledEvent } {
  return !!msg.event[AccountNames.AccountMigrationCancelledEvent];
}

if (isAccountMigrationCancelled(complexUnionLogicalTypes)) {
  // .wat does not exist
  complexUnionLogicalTypes.event[AccountNames.AccountMigrationCancelledEvent].wat; // should fail
  // Our type is AccountMigrationCancelled, not AccountMigrationScheduled
  // even though AccountMigrationScheduled has a `scheduledAt` property.
  complexUnionLogicalTypes.event[AccountNames.AccountMigrationScheduledEvent].scheduledAt; // should fail
}
