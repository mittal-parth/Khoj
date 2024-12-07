
// Auto Generated File.
// Created using Reputation CLI from True Network.
// To update the classes, use the "reputation-cli acm-prepare" at the root directory that contains "true-network".

@inline
function readMemory<T>(index: usize): T {
  return load<T>(index);
}


class HUNTATTESTATIONSCHEMA {
  timestamp: u64;
  numberOfTries: u32;
  huntId: u32;
  clueNumber: u32;

  constructor() {
    this.timestamp = readMemory<u64>(0);
    this.numberOfTries = readMemory<u32>(8);
    this.huntId = readMemory<u32>(12);
    this.clueNumber = readMemory<u32>(16);
  }
}


export class Attestations {
  static huntAttestationSchema: HUNTATTESTATIONSCHEMA = new HUNTATTESTATIONSCHEMA();
}
