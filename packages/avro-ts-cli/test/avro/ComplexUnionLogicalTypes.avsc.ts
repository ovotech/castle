/* eslint-disable @typescript-eslint/no-namespace */

export type AccountMigrationEvent = UkCoBoostpowerSupportKafkaMessages.AccountMigrationEvent;

export namespace ComOvoenergyKafkaCommonEvent {
    export const EventMetadataName = "com.ovoenergy.kafka.common.event.EventMetadata";
    /**
     * Metadata, to be used in each event class
     */
    export interface EventMetadata {
        /**
         * A globally unique ID for this Kafka message
         */
        eventId: string;
        /**
         * An ID that can be used to link all the requests and Kafka messages in a given transaction. If you already have a trace token from a previous event/request, you should copy it here. If this is the very start of a transaction, you should generate a fresh trace token and put it here. A UUID is suitable
         */
        traceToken: string;
        /**
         * A timestamp for when the event was created (in epoch millis)
         */
        createdAt: number;
    }
}

export namespace UkCoBoostpowerSupportKafkaMessages {
    export const AccountMigrationCancelledEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent";
    /**
     * Triggered by Migration Service. Before T2 signals that a siemens account migration has been cancelled. Migration is about to be restarted for the same account that means a new AccountMigrationScheduledEvent with a new flow id will be sent.Consumers should not react on this in normal case.
     */
    export interface AccountMigrationCancelledEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The unique national reference for Meter Point Administration Number
         */
        mpan: string;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * Because dates as Decimal are the best!
         */
        effectiveEnrollmentDateAsDecimal: number;
        /**
         * The time when the migration was cancelled (in epoch millis)
         */
        cancelledAt: number;
    }
    export const AccountMigrationCompletedEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent";
    /**
     * Triggered by SMILE. After SMILE processed the AccountMigrationValidatedEvent and switched over to Billy from Siemens they trigger this event to inform consumers like BIT CSA portal and Salesforce to do the necessary steps for the switchover
     */
    export interface AccountMigrationCompletedEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * The time when the migration was completed (in epoch millis)
         */
        completedAt: number;
    }
    export const AccountMigrationRollBackInitiatedEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent";
    /**
     * Triggered by Migration Service. After T2 it signals that a siemens account migration roll back was initiated. SMILE should change the data master system for the account from Billy to Siemens and inform other system about the result.
     */
    export interface AccountMigrationRollBackInitiatedEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * The time when the migration rollback was initiated (in epoch millis)
         */
        rollBackInitiatedAt: number;
    }
    export const AccountMigrationRolledBackEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent";
    /**
     * Triggered by SMILE. As the response to the AccountMigrationRollBackInitiatedEvent, SMILE indicates that mastering system for account data has been restored to be Siemens.As an action to this Billy, BIT CSA portal and Salesforce can do the necessary steps to clean up internal data and switch over to use Siemens data.
     */
    export interface AccountMigrationRolledBackEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * The time when the migration was rolled back (in epoch millis)
         */
        rolledBackAt: number;
    }
    export const AccountMigrationScheduledEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent";
    /**
     * Triggered by Migration Service. At T-2 it signals that a siemens account migration has been scheduled for T0 (effectiveEnrollmentDate).Consumers should do the necessary steps like removing primary card functionality in PAYG account service. If consumers see a new AccountMigrationScheduledEvent with a new flow id then they have to update their internal state with the new flow id since every subsequent message in the migration flow will use the same id
     */
    export interface AccountMigrationScheduledEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The unique national reference for Meter Point Administration Number
         */
        mpan: string;
        /**
         * The date when the customer came on supply with Boost (in epoch days)
         */
        supplyStartDate: number;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * The time when the migration was scheduled (in epoch millis)
         */
        scheduledAt: number;
    }
    export const AccountMigrationValidatedEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent";
    /**
     * Triggered by Balance Service. At T2 it signals that a siemens balance and transaction history was migrated to the new balance platform and the validation was successful. Billy is ready to be the source for balance and transaction history data. SMILE should change the data master system for the account from Siemens to Billy and inform other system about the result
     */
    export interface AccountMigrationValidatedEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * The time when the migrated balance and transactions were validated (in epoch millis)
         */
        validatedAt: number;
    }
    export const BalanceRetrievedMigrationEventName = "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent";
    /**
     * Triggered by Migration Service. At T1 signals that a siemens balance and transaction history is available for Billy. Contains details.
     */
    export interface BalanceRetrievedMigrationEvent {
        metadata: ComOvoenergyKafkaCommonEvent.EventMetadata;
        /**
         * Globally unique identifier for the enrollment
         */
        enrollmentId: string;
        /**
         * Unique identifier for the customer. GentrackId/SiemensId. Usually 7 digits.
         */
        accountId: string;
        /**
         * The unique national reference for Meter Point Administration Number
         */
        mpan: string;
        /**
         * The date when the account is going to be enrolled for the new balance platform (in epoch days)
         */
        effectiveEnrollmentDate: number;
        /**
         * The time when the balance and transaction history was fetched (in epoch millis)
         */
        retrievedAt: number;
    }
    export const AccountMigrationEventName = "uk.co.boostpower.support.kafka.messages.AccountMigrationEvent";
    /**
     * Account migration related events. It describes several flows: 1. Happy path: AccountMigrationScheduledEvent -> BalanceRetrievedMigrationEvent -> AccountMigrationValidatedEvent -> AccountMigrationCompletedEvent 2. Cancel where the migration is about the be restarted: AccountMigrationScheduledEvent -> BalanceRetrievedMigrationEvent -> AccountMigrationCancelledEvent -> Start from the beginning, AccountMigrationScheduledEvent -> AccountMigrationCancelledEvent -> Start from the beginning 3. Rollback: AccountMigrationScheduledEvent -> BalanceRetrievedMigrationEvent -> AccountMigrationValidatedEvent -> AccountMigrationCompletedEvent -> AccountMigrationRollBackInitiatedEvent -> AccountMigrationRolledBackEvent -> Start from the beginning AccountMigrationScheduledEvent generates a flow id which is used in every subsequent migration message to be grouped together
     */
    export interface AccountMigrationEvent {
        event: {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent": UkCoBoostpowerSupportKafkaMessages.AccountMigrationCancelledEvent;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent"?: never;
        } | {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent": UkCoBoostpowerSupportKafkaMessages.AccountMigrationCompletedEvent;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent"?: never;
        } | {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent": UkCoBoostpowerSupportKafkaMessages.AccountMigrationRollBackInitiatedEvent;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent"?: never;
        } | {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent": UkCoBoostpowerSupportKafkaMessages.AccountMigrationRolledBackEvent;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent"?: never;
        } | {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent": UkCoBoostpowerSupportKafkaMessages.AccountMigrationScheduledEvent;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent"?: never;
        } | {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent": UkCoBoostpowerSupportKafkaMessages.AccountMigrationValidatedEvent;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent"?: never;
        } | {
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCancelledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationCompletedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRollBackInitiatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationRolledBackEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationScheduledEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.AccountMigrationValidatedEvent"?: never;
            "uk.co.boostpower.support.kafka.messages.BalanceRetrievedMigrationEvent": UkCoBoostpowerSupportKafkaMessages.BalanceRetrievedMigrationEvent;
        };
    }
}
