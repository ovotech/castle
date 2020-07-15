/* eslint-disable @typescript-eslint/no-namespace */
import { toTypeScript } from '@ovotech/avro-ts';
import { Schema } from 'avsc';

const avro: Schema = {
  type: "record",
  name: "Communication",
  fields: [
    {
      name: "deliverTo",
      type: [
        {
          name: "Customer",
          type: "record",
          fields: [
            {
              name: "profileId",
              type: "string",
            },
            {
              name: "contactDetails",
              type: [
                "null",
                {
                  name: "ContactDetails",
                  type: "record",
                  fields: [
                    {
                      name: "emailAddress",
                      type: [ "null", "string" ]
                    },
                    {
                      name: "phoneNumber",
                      type: [ "null", "string" ]
                    },
                    {
                      name: "postalAddress",
                      type: [
                        "null",
                        {
                          name: "PostalAddress",
                          type: "record",
                          fields: [
                            {
                              name: "contactName",
                              type: [ "null", "string" ]
                            },
                            {
                              name: "company",
                              type: [ "null", "string" ]
                            },
                            {
                              name: "line1",
                              type: "string"
                            },
                            {
                              name: "line2",
                              type: [ "null", "string" ]
                            },
                            {
                              name: "town",
                              type: "string"
                            },
                            {
                              name: "county",
                              type: [ "null", "string" ]
                            },
                            {
                              name: "postcode",
                              type: "string"
                            },
                            {
                              name: "country",
                              type: [ "null", "string" ]
                            },
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        "DeliverTo.ContactDetails"
      ]
    }
  ]
};


const ts = toTypeScript(avro);

console.log(ts);

// interface Communication {
//   deliverTo: Customer | ContactDetails;
// }
// interface WrappedCommunication {
//   deliverTo: {
//     Customer: Customer,
//     ContactDetails: never,
//   } | {
//     Customer: never,
//     ContactDetails: ContactDetails,
//   }
// }
// interface ContactDetails {
//   emailAddress: null | string;
//   phoneNumber: null | string;
//   postalAddress: null | PostalAddress;
// }
// interface Customer {
//   profileId: string;
//   contactDetails: null | ContactDetails;
// }
// interface PostalAddress {
//   contactName: null | string;
//   company: null | string;
//   line1: string;
//   line2: null | string;
//   town: string;
//   county: null | string;
//   postcode: string;
//   country: null | string;
// }
