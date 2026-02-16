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
import {
  isPWAInstalled,
  cameFromLanding,
  clearLandingFlag,
  hasModalBeenShown,
  markModalAsShown,
  detectOS,
  type OSType,
} from '@/utils/pwaUtils';

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
        clearLandingFlag();
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
            Install Khoj
          </DialogTitle>
          <DialogDescription>
            Get the best treasure hunting experience by installing Khoj as an app on {osName}!
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
            <strong>Why install?</strong> Khoj works best when installed as a PWA, with a native app-like experience.
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
