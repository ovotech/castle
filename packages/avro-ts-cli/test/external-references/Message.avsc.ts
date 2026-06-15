import { CreateUser } from "./CreateUser.avsc";

import { UpdateAddress } from "./UpdateAddress.avsc";

export const MessageTypeSchema = "{\"type\":\"enum\",\"name\":\"MessageType\",\"symbols\":[\"CreateUser\",\"UpdateAddress\"]}";

export const MessageTypeName = "my.namespace.MessageType";

export type MessageType = "CreateUser" | "UpdateAddress";

export const MessageSchema = "{\"type\":\"record\",\"name\":\"Message\",\"namespace\":\"my.namespace\",\"fields\":[{\"name\":\"type\",\"type\":{\"type\":\"enum\",\"name\":\"MessageType\",\"symbols\":[\"CreateUser\",\"UpdateAddress\"]}},{\"name\":\"CreateUser\",\"type\":[\"null\",\"my.namespace.messages.CreateUser\"],\"default\":null},{\"name\":\"UpdateAddress\",\"type\":[\"null\",\"my.namespace.messages.UpdateAddress\"],\"default\":null}]}";

export const MessageName = "my.namespace.Message";

export interface Message {
    type: MessageType;
    /**
     * Default: null
     */
    CreateUser: null | CreateUser;
    /**
     * Default: null
     */
    UpdateAddress: null | UpdateAddress;
}
