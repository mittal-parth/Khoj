import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, Apple } from 'lucide-react';

// Detect if running as a PWA (standalone mode)
function isPWAInstalled(): boolean {
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
type OSType = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

function detectOS(): OSType {
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

interface InstallInstruction {
  step: number;
  text: string;
}

function getInstallInstructions(os: OSType): InstallInstruction[] {
  switch (os) {
    case 'ios':
      return [
        { step: 1, text: 'Tap the Share button in Safari (square with arrow)' },
        { step: 2, text: 'Scroll down and tap "Add to Home Screen"' },
        { step: 3, text: 'Tap "Add" in the top right corner' },
        { step: 4, text: 'Open Khoj from your home screen for the best experience!' },
      ];
    case 'android':
      return [
        { step: 1, text: 'Tap the menu button (three dots) in your browser' },
        { step: 2, text: 'Tap "Install app" or "Add to Home screen"' },
        { step: 3, text: 'Confirm by tapping "Install"' },
        { step: 4, text: 'Open Khoj from your home screen for the best experience!' },
      ];
    case 'windows':
    case 'linux':
      return [
        { step: 1, text: 'Click the install icon in the address bar (or menu)' },
        { step: 2, text: 'Click "Install" in the prompt that appears' },
        { step: 3, text: 'Khoj will open in its own window' },
        { step: 4, text: 'Find Khoj in your Start Menu or Desktop for quick access!' },
      ];
    case 'macos':
      return [
        { step: 1, text: 'Click the install icon in the address bar (Chrome/Edge)' },
        { step: 2, text: 'Click "Install" in the prompt that appears' },
        { step: 3, text: 'Khoj will open in its own window' },
        { step: 4, text: 'Find Khoj in your Applications folder or Launchpad!' },
      ];
    default:
      return [
        { step: 1, text: 'Look for an install option in your browser menu' },
        { step: 2, text: 'Click "Install" or "Add to Home Screen"' },
        { step: 3, text: 'Confirm the installation' },
        { step: 4, text: 'Open Khoj from your home screen or apps!' },
      ];
  }
}

function getOSIcon(os: OSType) {
  switch (os) {
    case 'ios':
    case 'macos':
      return <Apple className="w-5 h-5" />;
    case 'android':
      return <Smartphone className="w-5 h-5" />;
    case 'windows':
    case 'linux':
    default:
      return <Monitor className="w-5 h-5" />;
  }
}

function getOSDisplayName(os: OSType): string {
  switch (os) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'your device';
  }
}

// Session storage key to track if modal has been shown
const PWA_MODAL_SHOWN_KEY = 'khoj_pwa_modal_shown';
const CAME_FROM_LANDING_KEY = 'khoj_came_from_landing';

// Mark that user is navigating from landing page
export function markNavigatingFromLanding(): void {
  sessionStorage.setItem(CAME_FROM_LANDING_KEY, 'true');
}

// Check if user came from landing page
function cameFromLanding(): boolean {
  const value = sessionStorage.getItem(CAME_FROM_LANDING_KEY);
  // Clear the flag after checking
  sessionStorage.removeItem(CAME_FROM_LANDING_KEY);
  return value === 'true';
}

// Check if modal has already been shown this session
function hasModalBeenShown(): boolean {
  return sessionStorage.getItem(PWA_MODAL_SHOWN_KEY) === 'true';
}

// Mark modal as shown
function markModalAsShown(): void {
  sessionStorage.setItem(PWA_MODAL_SHOWN_KEY, 'true');
}

interface PWAInstallModalProps {
  forceShow?: boolean;
}

export function PWAInstallModal({ forceShow = false }: PWAInstallModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [os, setOS] = useState<OSType>('unknown');

  useEffect(() => {
    // Detect OS on mount
    setOS(detectOS());

    // Check if we should show the modal
    const shouldShow = forceShow || (
      !isPWAInstalled() && 
      cameFromLanding() && 
      !hasModalBeenShown()
    );

    if (shouldShow) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
        markModalAsShown();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const instructions = getInstallInstructions(os);
  const osIcon = getOSIcon(os);
  const osName = getOSDisplayName(os);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-main" />
            Install Khoj for Better Experience
          </DialogTitle>
          <DialogDescription>
            Get the best treasure hunting experience by installing Khoj as an app on {osName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-main/10 p-3 rounded-base border border-border">
            {osIcon}
            <span>Instructions for {osName}</span>
          </div>

          <ol className="space-y-3">
            {instructions.map((instruction) => (
              <li key={instruction.step} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-main text-main-foreground flex items-center justify-center text-sm font-bold border-2 border-border">
                  {instruction.step}
                </span>
                <span className="text-sm text-foreground/90 pt-0.5">
                  {instruction.text}
                </span>
              </li>
            ))}
          </ol>

          <div className="text-sm text-muted-foreground bg-secondary-background p-3 rounded-base border border-border mt-4">
            <strong>Why install?</strong> Get faster loading, offline access, and a native app-like experience while hunting treasures!
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            Got it, thanks!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
