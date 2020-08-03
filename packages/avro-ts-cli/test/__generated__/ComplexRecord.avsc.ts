/* eslint-disable @typescript-eslint/no-namespace */

export type User = ComExampleAvro.User;

export namespace ComExampleAvro {
    export const FooName = "com.example.avro.Foo";
    export interface Foo {
        label: string;
    }
    export const EmailAddressName = "com.example.avro.EmailAddress";
    /**
     * Stores details about an email address that a user has associated with their account.
     */
    export interface EmailAddress {
        /**
         * The email address, e.g. `foo@example.com`
         */
        address: string;
        /**
         * true if the user has clicked the link in a confirmation email to this address.
         *
         * Default: false
         */
        verified?: boolean;
        /**
         * Timestamp (milliseconds since epoch) when the email address was added to the account.
         */
        dateAdded: number;
    }
    export const UserName = "com.example.avro.User";
    /**
     * This is a user record in a fictitious to-do-list management app. It supports arbitrary grouping and nesting of items, and allows you to add items by email or by tweeting.
     *
     * Note this app doesn't actually exist. The schema is just a demo for [Avrodoc](https://github.com/ept/avrodoc)!
     */
    export interface User {
        /**
         * System-assigned numeric user ID. Cannot be changed by the user.
         */
        id: number;
        /**
         * The username chosen by the user. Can be changed by the user.
         */
        username: string;
        /**
         * The user's password, hashed using [scrypt](http://www.tarsnap.com/scrypt.html).
         */
        passwordHash: string;
        /**
         * Timestamp (milliseconds since epoch) when the user signed up
         */
        signupDate: number;
        mapField: {
            [index: string]: ComExampleAvro.Foo;
        };
        /**
         * All email addresses on the user's account
         */
        emailAddresses: ComExampleAvro.EmailAddress[];
        /**
         * Indicator of whether this authorization is currently active, or has been revoked
         */
        status: "ACTIVE" | "INACTIVE";
    }
}
