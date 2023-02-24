/* eslint-disable @typescript-eslint/no-namespace */

import { MyNamespaceMessages as MyNamespaceMessagesCreateUser } from "./CreateUser.avsc";

import { MyNamespaceMessages as MyNamespaceMessagesUpdateAddress } from "./UpdateAddress.avsc";

export type Message = MyNamespace.Message;

export namespace MyNamespace {
    export const MessageTypeSchema = "{\"type\":\"enum\",\"name\":\"MessageType\",\"symbols\":[\"CreateUser\",\"UpdateAddress\"]}";
    export const MessageTypeName = "my.namespace.MessageType";
    export type MessageType = "CreateUser" | "UpdateAddress";
    export const MessageSchema = "{\"type\":\"record\",\"name\":\"Message\",\"namespace\":\"my.namespace\",\"fields\":[{\"name\":\"type\",\"type\":{\"type\":\"enum\",\"name\":\"MessageType\",\"symbols\":[\"CreateUser\",\"UpdateAddress\"]}},{\"name\":\"CreateUser\",\"type\":[\"null\",\"my.namespace.messages.CreateUser\"],\"default\":null},{\"name\":\"UpdateAddress\",\"type\":[\"null\",\"my.namespace.messages.UpdateAddress\"],\"default\":null}]}";
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
