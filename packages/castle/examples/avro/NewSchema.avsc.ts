/* eslint-disable @typescript-eslint/no-namespace */

export type UserEvent = ComMyorgIdentityEventsExternal.UserEvent;

export namespace ComMyorgIdentityEventsExternal {
    export const UserName = "com.myorg.identity.events.external.User";
    export interface User {
        id: string;
        title: null | string;
    }
    export const UserEventName = "com.myorg.identity.events.external.UserEvent";
    export interface UserEvent {
        event: {
            "com.myorg.identity.events.external.Event.CreatedOrUpdate": ComMyorgIdentityEventsExternalEvent.CreatedOrUpdate;
            "com.myorg.identity.events.external.Event.Deleted"?: never;
        } | {
            "com.myorg.identity.events.external.Event.CreatedOrUpdate"?: never;
            "com.myorg.identity.events.external.Event.Deleted": ComMyorgIdentityEventsExternalEvent.Deleted;
        };
    }
}

export namespace ComMyorgIdentityEventsExternalEvent {
    export const CreatedOrUpdateName = "com.myorg.identity.events.external.Event.CreatedOrUpdate";
    export interface CreatedOrUpdate {
        user: ComMyorgIdentityEventsExternal.User;
    }
    export const DeletedName = "com.myorg.identity.events.external.Event.Deleted";
    export interface Deleted {
        id: string;
    }
}
