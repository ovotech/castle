/* eslint-disable @typescript-eslint/no-namespace */

import { MyNamespaceData as MyNamespaceDataAddress } from "./Address.avsc";

export type CreateUser = MyNamespaceMessages.CreateUser;

export namespace MyNamespaceMessages {
    export const CreateUserSchema = "{\"type\":\"record\",\"name\":\"CreateUser\",\"namespace\":\"my.namespace.messages\",\"fields\":[{\"name\":\"userId\",\"type\":\"string\",\"logicalType\":\"uuid\"},{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"address\",\"type\":\"my.namespace.data.Address\"}]}";
    export const CreateUserName = "my.namespace.messages.CreateUser";
    export interface CreateUser {
        userId: string;
        name: string;
        address: MyNamespaceDataAddress.Address;
    }
}
