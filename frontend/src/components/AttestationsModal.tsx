import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { FiRefreshCw, FiExternalLink, FiClock, FiUser, FiCheckCircle, FiRepeat } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AddressDisplay } from './AddressDisplay';
import { useNetworkState } from '../lib/utils';

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;
const SIGN_EXPLORER_BASE_URL = 'https://scan.sign.global/attestation';

// Attestation data interfaces
interface SolveAttestation {
  attestationId: string;
  clueIndex: number;
  solverAddress: string;
  teamLeaderAddress: string;
  timeTaken: number;
  attemptCount: number;
  timestamp: number;
}

interface RetryAttestation {
  attestationId: string;
  solverAddress: string;
  attemptCount: number;
  timestamp: number;
}

interface AttestationsModalProps {
  huntId?: string;
  huntName?: string;
  teamIdentifier?: string;
  totalClues?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AttestationsModal({ 
  huntId, 
  huntName, 
  teamIdentifier, 
  totalClues = 10,
  isOpen, 
  onClose 
}: AttestationsModalProps) {
  const [solveAttestations, setSolveAttestations] = useState<SolveAttestation[]>([]);
  const [retryAttestations, setRetryAttestations] = useState<Record<number, RetryAttestation[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { chainId } = useNetworkState();

  // Fetch attestations when modal opens
  useEffect(() => {
    if (isOpen && huntId && teamIdentifier && chainId) {
      fetchAttestations();
    }
  }, [isOpen, huntId, teamIdentifier, chainId]);

  const fetchAttestations = async () => {
    if (!huntId || !teamIdentifier || !chainId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/team-attestations/${huntId}/${teamIdentifier}?chainId=${chainId}&totalClues=${totalClues}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch attestations: ${response.status}`);
      }

      const data = await response.json();

      setSolveAttestations(data.solveAttestations || []);
      setRetryAttestations(data.retryAttestations || {});
    } catch (err) {
      console.error('Error fetching attestations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attestations');
      toast.error('Failed to load attestations');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTimeTaken = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getAttestationUrl = (attestationId: string) => {
    return `${SIGN_EXPLORER_BASE_URL}/${attestationId}`;
  };

  // Get all clue indices that have any attestations
  const getClueIndices = () => {
    const solveClues = new Set(solveAttestations.map(a => a.clueIndex));
    const retryClues = new Set(Object.keys(retryAttestations).map(k => parseInt(k)).filter(k => k > 0));
    return Array.from(new Set([...solveClues, ...retryClues])).sort((a, b) => a - b);
  };

  const clueIndices = getClueIndices();
  const hasHuntStart = retryAttestations[0] && retryAttestations[0].length > 0;
  const hasAnyAttestations = solveAttestations.length > 0 || Object.keys(retryAttestations).length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-[90vw] bg-white">
        <DialogHeader className="bg-main text-main-foreground p-6 border-b-2 border-black -m-6 mb-0">
          <DialogTitle className="text-center flex items-center justify-center text-xl">
            Your Attestations
            <Button
              onClick={fetchAttestations}
              disabled={isLoading}
              variant="neutral"
              size="icon"
              className="ml-4"
              title="Refresh attestations"
            >
              <FiRefreshCw className={`w-2 h-2 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col max-h-[60vh] p-4 overflow-y-auto">
          {/* Hunt Name */}
          <div className="text-center mb-4">
            <h3 className="text-sm text-foreground/60 font-semibold uppercase tracking-wide">
              {huntName || (huntId ? `Hunt #${huntId}` : 'Treasure Hunt')}
            </h3>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-foreground/60 font-medium">Loading attestations...</div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-red-600 mb-4 font-bold">Failed to load attestations</div>
              <Button onClick={fetchAttestations} variant="default">
                Try again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && !hasAnyAttestations && (
            <div className="flex items-center justify-center py-8">
              <div className="text-foreground/60 font-medium">No attestations found for your team</div>
            </div>
          )}

          {/* Attestations List */}
          {!isLoading && !error && hasAnyAttestations && (
            <div className="space-y-4">
              {/* Hunt Start Attestation */}
              {hasHuntStart && (
                <Card className="border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-main rounded-lg border-2 border-black">
                        <FiCheckCircle className="w-4 h-4 text-main-foreground" />
                      </div>
                      <h4 className="font-bold text-sm">Hunt Started</h4>
                    </div>
                    <div className="space-y-2">
                      {retryAttestations[0].map((attestation, index) => (
                        <div 
                          key={`hunt-start-${index}`}
                          className="flex items-center justify-between p-2 bg-muted rounded-lg border border-black/20"
                        >
                          <div className="flex items-center gap-2 text-sm">
                            <FiClock className="w-3 h-3 text-foreground/60" />
                            <span className="text-foreground/70">{formatTimestamp(attestation.timestamp)}</span>
                          </div>
                          <a
                            href={getAttestationUrl(attestation.attestationId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium text-main hover:underline"
                          >
                            View <FiExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clue Attestations */}
              {clueIndices.map(clueIndex => {
                const solveAttestation = solveAttestations.find(a => a.clueIndex === clueIndex);
                const retries = retryAttestations[clueIndex] || [];

                return (
                  <Card 
                    key={`clue-${clueIndex}`} 
                    className={cn(
                      "border-2 border-black shadow-[-2px_2px_0px_0px_rgba(0,0,0,1)]",
                      solveAttestation ? "bg-green-50" : "bg-white"
                    )}
                  >
                    <CardContent className="p-4">
                      {/* Clue Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-lg border-2 border-black",
                            solveAttestation ? "bg-green-500" : "bg-muted"
                          )}>
                            {solveAttestation ? (
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            ) : (
                              <FiRepeat className="w-4 h-4 text-foreground/60" />
                            )}
                          </div>
                          <h4 className="font-bold text-sm">Clue #{clueIndex}</h4>
                        </div>
                        {solveAttestation && (
                          <span className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full border border-green-400">
                            Solved
                          </span>
                        )}
                      </div>

                      {/* Solve Attestation */}
                      {solveAttestation && (
                        <div className="mb-3 p-3 bg-white rounded-lg border-2 border-green-400">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
                              Successful Solve
                            </span>
                            <a
                              href={getAttestationUrl(solveAttestation.attestationId)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm font-medium text-main hover:underline"
                            >
                              View <FiExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <FiUser className="w-3 h-3 text-foreground/60" />
                              <AddressDisplay address={solveAttestation.solverAddress} className="text-xs" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <FiClock className="w-3 h-3 text-foreground/60" />
                              <span className="text-xs text-foreground/70">
                                {formatTimeTaken(solveAttestation.timeTaken)}
                              </span>
                            </div>
                            <div className="col-span-2 flex items-center gap-1.5">
                              <span className="text-xs text-foreground/50">
                                {formatTimestamp(solveAttestation.timestamp)} • {solveAttestation.attemptCount} attempts
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Retry Attestations */}
                      {retries.length > 0 && (
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-2 block">
                            Attempts ({retries.length})
                          </span>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto">
                            {retries.map((retry, index) => (
                              <div 
                                key={`retry-${clueIndex}-${index}`}
                                className="flex items-center justify-between p-2 bg-muted rounded-lg border border-black/20"
                              >
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-foreground/50">#{retry.attemptCount}</span>
                                  <AddressDisplay address={retry.solverAddress} className="text-foreground/70" />
                                  <span className="text-foreground/50">{formatTimestamp(retry.timestamp)}</span>
                                </div>
                                <a
                                  href={getAttestationUrl(retry.attestationId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs font-medium text-main hover:underline"
                                >
                                  View <FiExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 mt-4 border-t-1 border-black">
            <div className="text-xs text-foreground/60 text-center">
              <p className="font-medium">
                Attestations are immutable on-chain records of your hunt progress via{' '}
                <a 
                  href="https://sign.global" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-main hover:underline"
                >
                  Sign Protocol
                </a>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
