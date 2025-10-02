import { Schema, U32, U64 } from "@truenetworkio/sdk";

// Note: Field order chosen to maintain stable offsets for existing fields.
// timestamp (u64) at 0, numberOfTries (u32) at 8, huntId (u32) at 12, clueNumber (u32) at 16, timeTaken (u32) at 20
export const huntAttestationSchema = Schema.create({
  timestamp: U64,
  numberOfTries: U32,
  huntId: U32,
  clueNumber: U32,
  timeTaken: U32,
});
