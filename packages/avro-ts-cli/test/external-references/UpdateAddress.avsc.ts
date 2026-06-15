import { Address } from "./Address.avsc";

export const UpdateAddressSchema = "{\"type\":\"record\",\"name\":\"UpdateAddress\",\"namespace\":\"my.namespace.messages\",\"fields\":[{\"name\":\"userId\",\"type\":\"string\",\"logicalType\":\"uuid\"},{\"name\":\"address\",\"type\":\"my.namespace.data.Address\"}]}";

export const UpdateAddressName = "my.namespace.messages.UpdateAddress";

export interface UpdateAddress {
    userId: string;
    address: Address;
}
