/* eslint-disable @typescript-eslint/no-namespace */

export type Address = MyNamespaceData.Address;

export namespace MyNamespaceData {
    export const AddressName = "my.namespace.data.Address";
    export interface Address {
        street: string;
        zipcode: string;
        country: string;
    }
}
