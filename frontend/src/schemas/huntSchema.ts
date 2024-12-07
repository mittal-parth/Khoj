import { Schema, U32, U64 } from "@truenetworkio/sdk";

export const huntAttestationSchema = Schema.create({
  huntId: U32,
  timestamp: U64,
  clueNumber: U32,
  numberOfTries: U32,
});
