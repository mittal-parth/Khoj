import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router';

interface HuddleContextType {
  currentHuntId: string | null;
  currentTeamIdentifier: string | null;
  setHuddleInfo: (huntId: string, teamIdentifier: string) => void;
  clearHuddleInfo: () => void;
  isInHunt: boolean;
}

const HuddleContext = createContext<HuddleContextType | undefined>(undefined);

export const useHuddleContext = () => {
  const context = useContext(HuddleContext);
  if (!context) {
    throw new Error('useHuddleContext must be used within HuddleProvider');
  }
  return context;
};

interface HuddleProviderProps {
  children: ReactNode;
}

export function HuddleProvider({ children }: HuddleProviderProps) {
  const [currentHuntId, setCurrentHuntId] = useState<string | null>(null);
  const [currentTeamIdentifier, setCurrentTeamIdentifier] = useState<string | null>(null);
  const location = useLocation();

  // Track if user is currently in a hunt (on clue pages)
  const isInHunt = location.pathname.includes('/hunt/') && location.pathname.includes('/clue/');

  // Clear huddle info when user leaves hunt pages
  useEffect(() => {
    if (!isInHunt) {
      setCurrentHuntId(null);
      setCurrentTeamIdentifier(null);
    }
  }, [isInHunt]);

  const setHuddleInfo = (huntId: string, teamIdentifier: string) => {
    setCurrentHuntId(huntId);
    setCurrentTeamIdentifier(teamIdentifier);
  };

  const clearHuddleInfo = () => {
    setCurrentHuntId(null);
    setCurrentTeamIdentifier(null);
  };

  const value: HuddleContextType = {
    currentHuntId,
    currentTeamIdentifier,
    setHuddleInfo,
    clearHuddleInfo,
    isInHunt,
  };

  return <HuddleContext.Provider value={value}>{children}</HuddleContext.Provider>;
}
