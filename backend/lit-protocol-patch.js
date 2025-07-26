// This file provides polyfills for the Lit Protocol library
import { webcrypto } from 'node:crypto';

// Export the webcrypto API for use in other modules
export const subtle = webcrypto.subtle;

// Export a function to get the webcrypto API
export function getWebCrypto() {
  return webcrypto;
}
