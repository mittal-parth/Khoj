// Session storage keys for PWA install modal
const PWA_MODAL_SHOWN_KEY = 'khoj_pwa_modal_shown';
const CAME_FROM_LANDING_KEY = 'khoj_came_from_landing';

// Mark that user is navigating from landing page
export function markNavigatingFromLanding(): void {
  sessionStorage.setItem(CAME_FROM_LANDING_KEY, 'true');
}

// Check if user came from landing page
export function cameFromLanding(): boolean {
  const value = sessionStorage.getItem(CAME_FROM_LANDING_KEY);
  return value === 'true';
}

// Clear the landing flag (call after deciding to show modal)
export function clearLandingFlag(): void {
  sessionStorage.removeItem(CAME_FROM_LANDING_KEY);
}

// Check if modal has already been shown this session
export function hasModalBeenShown(): boolean {
  return sessionStorage.getItem(PWA_MODAL_SHOWN_KEY) === 'true';
}

// Mark modal as shown
export function markModalAsShown(): void {
  sessionStorage.setItem(PWA_MODAL_SHOWN_KEY, 'true');
}

// Detect if running as a PWA (standalone mode)
export function isPWAInstalled(): boolean {
  // Check for standalone mode (iOS Safari, Android Chrome)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  // Check for iOS Safari standalone
  const isIOSStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
  // Check if launched from home screen on Android
  const referrer = document.referrer;
  const isAndroidTWA = referrer.includes('android-app://');
  
  return isStandalone || isIOSStandalone || isAndroidTWA;
}

// Detect operating system
export type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

export function detectOS(): OSType {
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() || '';
  
  // iOS detection
  if (/iphone|ipad|ipod/.test(userAgent) || 
      (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  
  // Android detection
  if (/android/.test(userAgent)) {
    return 'android';
  }
  
  // Windows detection
  if (/win/.test(platform) || /windows/.test(userAgent)) {
    return 'windows';
  }
  
  // macOS detection (non-touch Mac)
  if (/mac/.test(platform) && navigator.maxTouchPoints <= 1) {
    return 'macos';
  }
  
  // Linux detection
  if (/linux/.test(platform) || /linux/.test(userAgent)) {
    return 'linux';
  }
  
  return 'unknown';
}
