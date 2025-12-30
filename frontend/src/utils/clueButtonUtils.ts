import { HuntType, HUNT_TYPE } from "../types";

export type VerificationState = "idle" | "verifying" | "success" | "error";

interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Get the button variant based on hunt type and verification state
 */
export function getButtonVariant(
  huntType: HuntType,
  location: Location | null,
  capturedImage: File | null,
  verificationState: VerificationState
): "default" | "neutral" {
  if (huntType === HUNT_TYPE.GEO_LOCATION && !location) return "neutral";
  if (huntType === HUNT_TYPE.IMAGE && !capturedImage) return "neutral";
  switch (verificationState) {
    case "verifying":
      return "neutral";
    case "success":
      return "default";
    case "error":
      return "default";
    default:
      return "default";
  }
}

/**
 * Get the button CSS classes based on hunt type and verification state
 */
export function getButtonStyles(
  huntType: HuntType,
  location: Location | null,
  verificationState: VerificationState
): string {
  // For geolocation hunts, check location
  if (huntType === HUNT_TYPE.GEO_LOCATION && !location) {
    return "opacity-50 cursor-not-allowed";
  }
  // For image hunts, button is only shown when image is captured, so no need to check
  switch (verificationState) {
    case "verifying":
      return "opacity-75";
    case "success":
      return "bg-green-500 hover:bg-green-600 text-white";
    case "error":
      return "bg-red-500 hover:bg-red-600 text-white";
    default:
      return "";
  }
}

/**
 * Get the button text based on hunt type, location, and verification state
 */
export function getButtonText(
  huntType: HuntType,
  location: Location | null,
  verificationState: VerificationState,
  attempts: number
): string {
  // For geolocation hunts, check location first
  if (huntType === HUNT_TYPE.GEO_LOCATION && !location) {
    return "Waiting for location...";
  }
  // For image hunts, this function is only called when image is captured
  // (since the verify button is hidden when no image is captured)
  switch (verificationState) {
    case "verifying":
      return huntType === HUNT_TYPE.IMAGE ? "Verifying image..." : "Verifying location...";
    case "success":
      return "Correct Answer!";
    case "error":
      return huntType === HUNT_TYPE.IMAGE
        ? `Wrong image - ${attempts} attempts remaining`
        : `Wrong location - ${attempts} attempts remaining`;
    default:
      return huntType === HUNT_TYPE.IMAGE ? "Verify Image" : "Verify Location";
  }
}
