import { Address } from "./Address.avsc";

export const CreateUserSchema = "{\"type\":\"record\",\"name\":\"CreateUser\",\"namespace\":\"my.namespace.messages\",\"fields\":[{\"name\":\"userId\",\"type\":\"string\",\"logicalType\":\"uuid\"},{\"name\":\"name\",\"type\":\"string\"},{\"name\":\"address\",\"type\":\"my.namespace.data.Address\"}]}";

export const CreateUserName = "my.namespace.messages.CreateUser";

export interface CreateUser {
    userId: string;
    name: string;
    address: Address;
}
