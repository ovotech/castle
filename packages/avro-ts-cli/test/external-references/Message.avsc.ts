/* eslint-disable @typescript-eslint/no-namespace */

import { MyNamespaceMessages as MyNamespaceMessagesCreateUser } from "./CreateUser.avsc";

import { MyNamespaceMessages as MyNamespaceMessagesUpdateAddress } from "./UpdateAddress.avsc";

export type Message = MyNamespace.Message;

export namespace MyNamespace {
    export const MessageTypeName = "my.namespace.MessageType";
    export type MessageType = "CreateUser" | "UpdateAddress";
    export const MessageName = "my.namespace.Message";
    export interface Message {
        type: MyNamespace.MessageType;
        /**
         * Default: null
         */
        CreateUser: null | MyNamespaceMessagesCreateUser.CreateUser;
        /**
         * Default: null
         */
        UpdateAddress: null | MyNamespaceMessagesUpdateAddress.UpdateAddress;
    }
}
