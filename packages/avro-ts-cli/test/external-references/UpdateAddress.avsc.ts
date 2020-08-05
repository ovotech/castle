/* eslint-disable @typescript-eslint/no-namespace */

import { MyNamespaceData as MyNamespaceDataAddress } from "./Address.avsc";

export type UpdateAddress = MyNamespaceMessages.UpdateAddress;

export namespace MyNamespaceMessages {
    export const UpdateAddressName = "my.namespace.messages.UpdateAddress";
    export interface UpdateAddress {
        userId: string;
        address: MyNamespaceDataAddress.Address;
    }
}
