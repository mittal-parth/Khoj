import { toast } from "sonner";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;

export interface ProgressData {
  huntId: number;
  teamIdentifier: string;
  latestClueSolved: number;
  totalClues: number;
  isHuntCompleted: boolean;
  nextClue: number | null;
  message?: string;
}

/**
 * Fetch progress data for a team/individual in a hunt
 */
export async function fetchProgress(
  huntId: number,
  teamIdentifier: string,
  chainId: string | number,
  contractAddress: string,
  totalClues?: number
): Promise<ProgressData | null> {
  try {

    const url = new URL(`${BACKEND_URL}/hunts/${huntId}/teams/${teamIdentifier}/progress`);
    url.searchParams.set('chainId', chainId.toString());
    url.searchParams.set('contractAddress', contractAddress);
    if (totalClues) {
      url.searchParams.set('totalClues', totalClues.toString());
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error(`Failed to fetch progress: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching progress:", error);
    return null;
  }
}

/**
 * Check if a user can access a specific clue
 */
export function canAccessClue(progress: ProgressData | null, clueIndex: number): boolean {
  if (!progress) return clueIndex === 1; // Default to allowing first clue if no progress data
  
  // Clue 1 is always accessible
  if (clueIndex === 1) return true;
  
  // For other clues, check if the previous clue was solved
  // Since clues are solved sequentially, if latestClueSolved >= clueIndex - 1, then clueIndex - 1 was solved
  return progress.latestClueSolved >= clueIndex - 1;
}

/**
 * Check if a clue has already been solved by the team
 */
export function isClueSolved(progress: ProgressData | null, clueIndex: number): boolean {
  if (!progress) return false;
  
  // A clue is solved if latestClueSolved >= clueIndex
  return progress.latestClueSolved >= clueIndex;
}

/**
 * Get the next clue to navigate to based on progress
 */
export function getNextClue(progress: ProgressData | null): number | null {
  if (!progress) return 1; // Default to first clue if no progress data
  return progress.nextClue;
}

/**
 * Check if hunt is completed
 */
export function isHuntCompleted(progress: ProgressData | null): boolean {
  if (!progress) return false;
  return progress.isHuntCompleted;
}

/**
 * Get the latest solved clue index
 */
export function getLatestSolvedClue(progress: ProgressData | null): number {
  if (!progress) return 0;
  return progress.latestClueSolved;
}

/**
 * Navigate to the appropriate clue based on progress
 * Returns the clue index to navigate to, or null if should go to hunt end
 */
export function getNavigationTarget(progress: ProgressData | null): number | null {
  if (!progress) return 1;
  
  if (progress.isHuntCompleted) {
    return null; // Go to hunt end
  }
  
  return progress.nextClue || 1;
}

/**
 * Unified navigation handler that consolidates all navigation logic
 */
async function handleNavigation(
  huntId: number,
  teamIdentifier: string,
  currentClueIndex: number,
  navigate: (path: string) => void,
  chainId: string | number,
  contractAddress: string,
  totalClues?: number,
  options: {
    isSync?: boolean;
    allowVerification?: boolean;
    showSuccessToast?: boolean;
    isResume?: boolean;
  } = {}
): Promise<boolean> {
  const { isSync = false, allowVerification = false, showSuccessToast = true, isResume = false } = options;
  
  try {
    
    const progress = await fetchProgress(huntId, teamIdentifier, chainId, contractAddress, totalClues);
    
    if (!progress) {
      if (isSync) {
        toast.error("Failed to sync progress");
      }
      return allowVerification; // Allow verification if we can't fetch progress
    }

    const targetClue = getNavigationTarget(progress);
    
    // For sync/resume: navigate if targetClue is different from currentClueIndex OR hunt is completed (targetClue is null)
    // For validation: navigate if current clue is not accessible
    const shouldNavigate = (isSync || isResume)
      ? (targetClue !== currentClueIndex) // This handles both different clues AND hunt completion (null)
      : !canAccessClue(progress, currentClueIndex);
    
    console.log("handleNavigation debug:", {
      progress,
      targetClue,
      shouldNavigate,
      currentClueIndex,
      canAccess: canAccessClue(progress, currentClueIndex),
      isSync,
      isResume,
      allowVerification
    });
    
    if (shouldNavigate) {
      if (targetClue === null) {
        // Hunt is completed, go to end
        navigate(`/hunt/${huntId}/end`);
        if (showSuccessToast) {
          toast.success("Hunt completed! Redirecting to results...");
        }
        return true;
      } else if (targetClue > 1 || isSync) {
        // Navigate to the correct clue
        navigate(`/hunt/${huntId}/clue/${targetClue}`);
        if (showSuccessToast) {
          if (isSync) {
            toast.success(`Synced! Redirecting to clue ${targetClue}...`);
          } else {
            toast.success(`Resuming from clue ${targetClue}...`);
          }
        }
        return true;
      }
    }

    // For sync flow when current clue is still accessible
    if (isSync && showSuccessToast) {
      toast.success("Progress synced successfully!");
    }
    
    // For validation flow, always allow if we reach here (clue is accessible)
    if (allowVerification) {
      return true;
    }
    
    // For start hunt flow when targetClue is 1, continue with normal flow
    return !isSync && targetClue === 1 ? false : true;
  } catch (error) {
    console.error(`Error ${isSync ? 'syncing' : 'checking'} progress:`, error);
    if (isSync) {
      toast.error("Failed to sync progress");
    }
    return allowVerification; // Allow verification if error occurs
  }
}

/**
 * Sync progress and handle navigation
 * This is the main function that should be called when syncing progress
 */
export async function syncProgressAndNavigate(
  huntId: number,
  teamIdentifier: string,
  currentClueIndex: number,
  navigate: (path: string) => void,
  chainId: string | number,
  contractAddress: string,
  totalClues?: number
): Promise<boolean> {
  return handleNavigation(huntId, teamIdentifier, currentClueIndex, navigate, chainId, contractAddress, totalClues, { isSync: true });
}

/**
 * Validate clue access before allowing verification
 * Returns true if verification should proceed, false if should redirect
 */
export async function validateClueAccess(
  huntId: number,
  teamIdentifier: string,
  clueIndex: number,
  navigate: (path: string) => void,
  chainId: string | number,
  contractAddress: string,
  totalClues?: number
): Promise<boolean> {
  try {

    const progress = await fetchProgress(huntId, teamIdentifier, chainId, contractAddress, totalClues);
    
    if (!progress) {
      // If we can't fetch progress, allow verification to proceed
      return true;
    }

    // Check if clue is accessible
    if (!canAccessClue(progress, clueIndex)) {
      const targetClue = getNavigationTarget(progress);
      
      if (targetClue === null) {
        // Hunt is completed
        navigate(`/hunt/${huntId}/end`);
        toast.info("Hunt already completed! Redirecting to results...");
      } else {
        // Navigate to correct clue
        navigate(`/hunt/${huntId}/clue/${targetClue}`);
        toast.info(`This clue is not accessible yet! Redirecting to clue ${targetClue}...`);
      }
      return false;
    }

    // Check if clue has already been solved by the team
    if (isClueSolved(progress, clueIndex)) {
      const targetClue = getNavigationTarget(progress);
      
      if (targetClue === null) {
        // Hunt is completed
        navigate(`/hunt/${huntId}/end`);
        toast.info("Hunt already completed! Redirecting to results...");
      } else {
        // Navigate to next clue
        navigate(`/hunt/${huntId}/clue/${targetClue}`);
        toast.info(`This clue has already been solved! Redirecting to clue ${targetClue}...`);
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating clue access:", error);
    // If validation fails, allow verification to proceed
    return true;
  }
}

/**
 * Get team identifier for progress checking
 * Uses teamId for teams, wallet address for solo users
 */
export function getTeamIdentifier(teamData: any, userWallet: string): string {
  return teamData?.teamId?.toString() || userWallet;
}

/**
 * Check if a hunt has been started by querying for hunt start attestation
 * A hunt is considered started if there's an attestation with clueIndex: 0
 */
export async function checkHuntStarted(
  huntId: number,
  teamIdentifier: string,
  chainId: string | number,
  contractAddress: string
): Promise<boolean> {
  try {
    const url = new URL(
      `${BACKEND_URL}/hunts/${huntId}/clues/0/teams/${teamIdentifier}/attempts`
    );
    url.searchParams.set("chainId", chainId.toString());
    url.searchParams.set("contractAddress", contractAddress);

    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error(`Failed to check hunt start: ${response.status}`);
      return false;
    }

    const data = await response.json();

    // If attemptCount > 0, it means the hunt has been started
    // (attestation with clueIndex: 0 exists)
    return data.attemptCount > 0;
  } catch (error) {
    console.error("Error checking hunt start:", error);
    return false;
  }
}

/**
 * Check progress and navigate to appropriate location when starting a hunt
 * This is used when a user clicks "Start Hunt" to determine where to go
 */
export async function checkProgressAndNavigate(
  huntId: number,
  teamIdentifier: string,
  totalClues: number,
  navigate: (path: string) => void,
  chainId: string | number,
  contractAddress: string
): Promise<boolean> {
  return handleNavigation(huntId, teamIdentifier, 1, navigate, chainId, contractAddress, totalClues, { isResume: true });
}
