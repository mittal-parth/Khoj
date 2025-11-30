/**
 * Common validation utility functions for the Khoj frontend
 * These helpers consolidate repeated validation patterns used across components
 */

/**
 * Type guard to ensure address is a valid hex string (40 hex chars after 0x prefix)
 * @param address - The address string to validate
 * @returns True if address is a valid hex address
 */
export function isValidHexAddress(address: string): address is `0x${string}` {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Check if a value is defined (not undefined and not null)
 * @param value - The value to check
 * @returns True if value is defined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Check if a contract address is the zero address (not deployed)
 * @param address - The contract address to check
 * @returns True if address is the zero address
 */
export function isZeroAddress(address: string): boolean {
  return address === "0x0000000000000000000000000000000000000000";
}

/**
 * Check if a contract address is valid and deployed
 * @param address - The contract address to check
 * @returns True if address is valid and not zero
 */
export function isValidContractAddress(address: string): boolean {
  return isValidHexAddress(address) && !isZeroAddress(address);
}

/**
 * Parameters required for hunt-related operations
 */
export interface HuntParams {
  huntId: string | undefined;
  chainId: string | number | undefined;
  contractAddress: string | undefined;
}

/**
 * Parameters required for clue-related operations
 */
export interface ClueParams extends HuntParams {
  clueId: string | undefined;
}

/**
 * Parameters required for team-related operations
 */
export interface TeamParams extends HuntParams {
  teamIdentifier: string | undefined;
}

/**
 * Parameters required for user wallet operations
 */
export interface WalletParams {
  userWallet: string | undefined;
}

/**
 * Combined parameters for clue verification operations
 */
export interface ClueVerificationParams extends ClueParams, TeamParams, WalletParams {}

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  missingParams: string[];
}

/**
 * Validate hunt parameters
 * @param params - Hunt parameters to validate
 * @returns Validation result with isValid flag and list of missing params
 */
export function validateHuntParams(params: HuntParams): ValidationResult {
  const missingParams: string[] = [];
  
  if (!isDefined(params.huntId)) missingParams.push('huntId');
  if (!isDefined(params.chainId)) missingParams.push('chainId');
  if (!isDefined(params.contractAddress)) missingParams.push('contractAddress');
  
  return {
    isValid: missingParams.length === 0,
    missingParams,
  };
}

/**
 * Validate clue parameters
 * @param params - Clue parameters to validate
 * @returns Validation result with isValid flag and list of missing params
 */
export function validateClueParams(params: ClueParams): ValidationResult {
  const huntResult = validateHuntParams(params);
  const missingParams = [...huntResult.missingParams];
  
  if (!isDefined(params.clueId)) missingParams.push('clueId');
  
  return {
    isValid: missingParams.length === 0,
    missingParams,
  };
}

/**
 * Validate team parameters
 * @param params - Team parameters to validate
 * @returns Validation result with isValid flag and list of missing params
 */
export function validateTeamParams(params: TeamParams): ValidationResult {
  const huntResult = validateHuntParams(params);
  const missingParams = [...huntResult.missingParams];
  
  if (!isDefined(params.teamIdentifier)) missingParams.push('teamIdentifier');
  
  return {
    isValid: missingParams.length === 0,
    missingParams,
  };
}

/**
 * Validate wallet parameters
 * @param params - Wallet parameters to validate
 * @returns Validation result with isValid flag and list of missing params
 */
export function validateWalletParams(params: WalletParams): ValidationResult {
  const missingParams: string[] = [];
  
  if (!isDefined(params.userWallet)) missingParams.push('userWallet');
  
  return {
    isValid: missingParams.length === 0,
    missingParams,
  };
}

/**
 * Validate clue verification parameters
 * @param params - All parameters needed for clue verification
 * @returns Validation result with isValid flag and list of missing params
 */
export function validateClueVerificationParams(params: ClueVerificationParams): ValidationResult {
  const missingParams: string[] = [];
  
  // Validate hunt params only once
  if (!isDefined(params.huntId)) missingParams.push('huntId');
  if (!isDefined(params.chainId)) missingParams.push('chainId');
  if (!isDefined(params.contractAddress)) missingParams.push('contractAddress');
  
  // Validate clue-specific param
  if (!isDefined(params.clueId)) missingParams.push('clueId');
  
  // Validate team-specific param
  if (!isDefined(params.teamIdentifier)) missingParams.push('teamIdentifier');
  
  // Validate wallet param
  if (!isDefined(params.userWallet)) missingParams.push('userWallet');
  
  return {
    isValid: missingParams.length === 0,
    missingParams,
  };
}

/**
 * Check if all required hunt params are present (simple boolean check)
 * @param params - Hunt parameters to validate
 * @returns True if all params are defined
 */
export function hasRequiredHuntParams(params: HuntParams): boolean {
  return validateHuntParams(params).isValid;
}

/**
 * Check if all required clue params are present (simple boolean check)
 * @param params - Clue parameters to validate
 * @returns True if all params are defined
 */
export function hasRequiredClueParams(params: ClueParams): boolean {
  return validateClueParams(params).isValid;
}

/**
 * Check if all required team params are present (simple boolean check)
 * @param params - Team parameters to validate
 * @returns True if all params are defined
 */
export function hasRequiredTeamParams(params: TeamParams): boolean {
  return validateTeamParams(params).isValid;
}

/**
 * Assert that hunt parameters are defined - for use after validation checks
 * This helps TypeScript understand the types are narrowed after validation
 * @param huntId - The hunt ID 
 * @param chainId - The chain ID
 * @param contractAddress - The contract address
 * @returns Object with all parameters asserted as non-undefined
 */
export function assertHuntParams(
  huntId: string | undefined,
  chainId: string | number | undefined,
  contractAddress: string | undefined
): { huntId: string; chainId: string | number; contractAddress: string } {
  if (!isDefined(huntId) || !isDefined(chainId) || !isDefined(contractAddress)) {
    throw new Error('Hunt parameters are not defined');
  }
  return { huntId, chainId, contractAddress };
}

/**
 * Assert that clue parameters are defined - for use after validation checks
 * @param huntId - The hunt ID
 * @param clueId - The clue ID
 * @param chainId - The chain ID
 * @param contractAddress - The contract address
 * @returns Object with all parameters asserted as non-undefined
 */
export function assertClueParams(
  huntId: string | undefined,
  clueId: string | undefined,
  chainId: string | number | undefined,
  contractAddress: string | undefined
): { huntId: string; clueId: string; chainId: string | number; contractAddress: string } {
  if (!isDefined(huntId) || !isDefined(clueId) || !isDefined(chainId) || !isDefined(contractAddress)) {
    throw new Error('Clue parameters are not defined');
  }
  return { huntId, clueId, chainId, contractAddress };
}
