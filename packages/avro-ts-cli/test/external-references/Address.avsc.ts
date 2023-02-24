/* eslint-disable @typescript-eslint/no-namespace */

export type Address = MyNamespaceData.Address;

export namespace MyNamespaceData {
    export const AddressSchema = "{\"type\":\"record\",\"name\":\"Address\",\"namespace\":\"my.namespace.data\",\"fields\":[{\"name\":\"street\",\"type\":\"string\"},{\"name\":\"zipcode\",\"type\":\"string\"},{\"name\":\"country\",\"type\":\"string\"}]}";
    export const AddressName = "my.namespace.data.Address";
    export interface Address {
        street: string;
        zipcode: string;
        country: string;
    }
}
