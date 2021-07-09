/* eslint-disable @typescript-eslint/no-namespace */

export type UserEvent = ComMyorgIdentityEvent.UserEvent;

export namespace ComMyorgIdentityEvent {
    export const UserName = "com.myorg.identity.event.User";
    export interface User {
        id: string;
        title: null | string;
    }
    export const CreatedOrUpdateName = "com.myorg.identity.event.CreatedOrUpdate";
    export interface CreatedOrUpdate {
        user: ComMyorgIdentityEvent.User;
    }
    export const DeletedName = "com.myorg.identity.event.Deleted";
    export interface Deleted {
        id: string;
    }
    export const UserEventName = "com.myorg.identity.event.UserEvent";
    export interface UserEvent {
        event: {
            "com.myorg.identity.event.CreatedOrUpdate": ComMyorgIdentityEvent.CreatedOrUpdate;
            "com.myorg.identity.event.Deleted"?: never;
        } | {
            "com.myorg.identity.event.CreatedOrUpdate"?: never;
            "com.myorg.identity.event.Deleted": ComMyorgIdentityEvent.Deleted;
        };
    }
}
