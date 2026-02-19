import { Link } from "react-router-dom";
import { getContract, readContract } from "thirdweb";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { useEffect, useMemo, useState } from "react";
import {
  BsArrowRepeat,
  BsBoxArrowUpRight,
  BsCheckCircleFill,
  BsChevronDown,
  BsChevronUp,
  BsPlayFill,
} from "react-icons/bs";
import { MdOutlineTravelExplore } from "react-icons/md";

import { huntABI } from "../assets/hunt_abi.ts";
import { client } from "../lib/client";
import { useNetworkState } from "../lib/utils";
import { formatDateRange } from "../utils/dateUtils";
import { isValidContractAddress } from "../utils/validationUtils";
import { Hunt } from "../types";
import { toast } from "@/components/ui/toast";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Loader } from "./ui/loader";

const BACKEND_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL;
const SIGN_SCAN_BASE_URL = "https://scan.sign.global/";

interface SolvedAttestation {
  attestationId: string | null;
  clueIndex: number;
  teamIdentifier: string;
  teamLeaderAddress: string | null;
  solverAddress: string | null;
  attemptCount: number;
  timeTaken: number;
  timestamp: number;
  schemaId: string | null;
}

interface AttemptAttestation {
  attestationId: string | null;
  clueIndex: number;
  teamIdentifier: string;
  attemptCount: number;
  timestamp: number;
  solverAddress: string | null;
  schemaId: string | null;
}

interface ProgressApiResponse {
  latestClueSolved: number;
  nextClue: number | null;
  isHuntCompleted: boolean;
  solvedAttestations?: SolvedAttestation[];
  clueSchemaId?: string;
}

interface AttemptsApiResponse {
  attempts?: AttemptAttestation[];
  retrySchemaId?: string;
}

type TimelineEventType = "hunt_start" | "attempt" | "solve";

interface TimelineEvent {
  type: TimelineEventType;
  timestamp: number;
  clueIndex: number;
  attestationId: string | null;
  schemaId: string | null;
  solverAddress: string | null;
  attemptCount?: number;
  timeTaken?: number;
}

interface HuntActivity {
  huntId: number;
  hunt: Hunt;
  teamIdentifier: string;
  solvedAttestations: SolvedAttestation[];
  attemptAttestations: AttemptAttestation[];
  timeline: TimelineEvent[];
  clueSchemaId: string | null;
  retrySchemaId: string | null;
  latestActivityTimestamp: number | null;
  isHuntCompleted: boolean;
  nextClue: number | null;
}

function formatAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(timestamp: number) {
  if (!timestamp || Number.isNaN(timestamp)) return "Unknown time";
  return new Date(timestamp * 1000).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  if (!seconds || Number.isNaN(seconds)) return "0s";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function buildScanSearchUrl(query: string) {
  return `${SIGN_SCAN_BASE_URL}?q=${encodeURIComponent(query)}`;
}

function buildAttestationUrl(attestationId: string) {
  return `${SIGN_SCAN_BASE_URL}attestation/${encodeURIComponent(attestationId)}`;
}

function getTimelineLabel(event: TimelineEvent) {
  if (event.type === "hunt_start") return "Hunt started";
  if (event.type === "attempt") return `Attempt logged for clue ${event.clueIndex}`;
  return `Solved clue ${event.clueIndex}`;
}

function getTimelineIcon(eventType: TimelineEventType) {
  if (eventType === "hunt_start") return <BsPlayFill className="h-4 w-4" />;
  if (eventType === "attempt") return <BsArrowRepeat className="h-4 w-4" />;
  return <BsCheckCircleFill className="h-4 w-4" />;
}

export function Profile() {
  const account = useActiveAccount();
  const address = account?.address;
  const { currentNetwork, contractAddress, chainId, currentChain } = useNetworkState();

  const [huntActivities, setHuntActivities] = useState<HuntActivity[]>([]);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [expandedHunts, setExpandedHunts] = useState<Record<number, boolean>>({});

  const contract = useMemo(() => {
    if (!isValidContractAddress(contractAddress)) return null;
    return getContract({
      client,
      chain: currentChain,
      address: contractAddress as `0x${string}`,
      abi: huntABI,
    });
  }, [contractAddress, currentChain]);

  const {
    data: huntsData,
    isLoading: isHuntsLoading,
    error: huntsError,
  } = useReadContract({
    contract: contract!,
    method: "getAllHunts",
    params: [],
    queryOptions: {
      enabled: !!contract && !!address,
    },
  }) as {
    data: Hunt[] | undefined;
    isLoading: boolean;
    error: Error | null;
  };

  const hunts = huntsData || [];

  const participatedHunts = useMemo(() => {
    if (!address) return [] as Array<{ hunt: Hunt; huntId: number }>;
    const normalizedAddress = address.toLowerCase();
    return hunts
      .map((hunt, huntId) => ({ hunt, huntId }))
      .filter(({ hunt }) =>
        (hunt.participants || []).some(
          (participant) => participant.toLowerCase() === normalizedAddress
        )
      );
  }, [address, hunts]);

  useEffect(() => {
    let isCancelled = false;

    const fetchProfileActivity = async () => {
      if (!address || !contract || !chainId || !contractAddress || !BACKEND_URL) {
        setHuntActivities([]);
        setProfileError(null);
        return;
      }

      if (participatedHunts.length === 0) {
        setHuntActivities([]);
        setProfileError(null);
        return;
      }

      setIsProfileLoading(true);
      setProfileError(null);

      try {
        const activityByHunt = await Promise.all(
          participatedHunts.map(async ({ hunt, huntId }): Promise<HuntActivity> => {
            let teamIdentifier = address;

            if (hunt.teamsEnabled) {
              try {
                const teamId = await readContract({
                  contract,
                  method: "getParticipantTeamId",
                  params: [BigInt(huntId), address as `0x${string}`],
                });
                const numericTeamId = Number(teamId);
                if (Number.isFinite(numericTeamId) && numericTeamId > 0) {
                  teamIdentifier = numericTeamId.toString();
                }
              } catch (error) {
                console.warn(
                  `Failed to resolve team identifier for hunt ${huntId}:`,
                  error
                );
              }
            }

            const progressUrl = new URL(
              `${BACKEND_URL}/hunts/${huntId}/teams/${teamIdentifier}/progress`
            );
            progressUrl.searchParams.set("chainId", chainId.toString());
            progressUrl.searchParams.set("contractAddress", contractAddress);

            const progressResponse = await fetch(progressUrl.toString());
            if (!progressResponse.ok) {
              throw new Error(
                `Progress request failed for hunt ${huntId}: ${progressResponse.status}`
              );
            }

            const progressData = (await progressResponse.json()) as ProgressApiResponse;
            const solvedAttestations = (progressData.solvedAttestations || [])
              .map((attestation) => ({
                ...attestation,
                clueIndex: Number(attestation.clueIndex),
                attemptCount: Number(attestation.attemptCount),
                timeTaken: Number(attestation.timeTaken),
                timestamp: Number(attestation.timestamp),
              }))
              .filter(
                (attestation) =>
                  Number.isFinite(attestation.clueIndex) &&
                  Number.isFinite(attestation.timestamp)
              );

            const maxClueIndexToQuery = Math.max(
              1,
              Number(progressData.latestClueSolved || 0) + 1
            );
            const clueIndexes = Array.from(
              { length: maxClueIndexToQuery + 1 },
              (_, clueIndex) => clueIndex
            );

            const attemptResponses = await Promise.all(
              clueIndexes.map(async (clueIndex) => {
                try {
                  const attemptsUrl = new URL(
                    `${BACKEND_URL}/hunts/${huntId}/clues/${clueIndex}/teams/${teamIdentifier}/attempts`
                  );
                  attemptsUrl.searchParams.set("chainId", chainId.toString());
                  attemptsUrl.searchParams.set("contractAddress", contractAddress);

                  const response = await fetch(attemptsUrl.toString());
                  if (!response.ok) {
                    return {
                      attempts: [] as AttemptAttestation[],
                      retrySchemaId: null as string | null,
                    };
                  }

                  const parsed = (await response.json()) as AttemptsApiResponse;
                  return {
                    attempts: (parsed.attempts || [])
                      .map((attempt) => ({
                        ...attempt,
                        clueIndex: Number(attempt.clueIndex),
                        attemptCount: Number(attempt.attemptCount),
                        timestamp: Number(attempt.timestamp),
                      }))
                      .filter(
                        (attempt) =>
                          Number.isFinite(attempt.clueIndex) &&
                          Number.isFinite(attempt.timestamp)
                      ),
                    retrySchemaId: parsed.retrySchemaId || null,
                  };
                } catch (error) {
                  console.warn(
                    `Failed to fetch attempts for hunt ${huntId}, clue ${clueIndex}:`,
                    error
                  );
                  return {
                    attempts: [] as AttemptAttestation[],
                    retrySchemaId: null as string | null,
                  };
                }
              })
            );

            const attemptAttestations = attemptResponses.flatMap(
              (entry) => entry.attempts
            );
            const retrySchemaId =
              attemptResponses.find((entry) => entry.retrySchemaId)?.retrySchemaId ||
              null;

            const timeline: TimelineEvent[] = [
              ...attemptAttestations.map((attempt) => ({
                type: attempt.clueIndex === 0 ? "hunt_start" : "attempt",
                clueIndex: attempt.clueIndex,
                timestamp: attempt.timestamp,
                attestationId: attempt.attestationId,
                schemaId: attempt.schemaId || retrySchemaId,
                solverAddress: attempt.solverAddress,
                attemptCount: attempt.attemptCount,
              })),
              ...solvedAttestations.map((solved) => ({
                type: "solve" as const,
                clueIndex: solved.clueIndex,
                timestamp: solved.timestamp,
                attestationId: solved.attestationId,
                schemaId: solved.schemaId || progressData.clueSchemaId || null,
                solverAddress: solved.solverAddress,
                attemptCount: solved.attemptCount,
                timeTaken: solved.timeTaken,
              })),
            ].sort((a, b) => a.timestamp - b.timestamp);

            const latestActivityTimestamp =
              timeline.length > 0
                ? timeline[timeline.length - 1].timestamp
                : null;

            return {
              huntId,
              hunt,
              teamIdentifier,
              solvedAttestations,
              attemptAttestations,
              timeline,
              clueSchemaId: progressData.clueSchemaId || null,
              retrySchemaId,
              latestActivityTimestamp,
              isHuntCompleted: Boolean(progressData.isHuntCompleted),
              nextClue:
                progressData.nextClue === null
                  ? null
                  : Number(progressData.nextClue),
            };
          })
        );

        if (isCancelled) return;

        const sortedActivity = activityByHunt.sort((a, b) => {
          return (b.latestActivityTimestamp || 0) - (a.latestActivityTimestamp || 0);
        });

        setHuntActivities(sortedActivity);

        setExpandedHunts((previous) => {
          if (Object.keys(previous).length > 0) return previous;
          if (sortedActivity.length === 0) return {};
          return { [sortedActivity[0].huntId]: true };
        });
      } catch (error) {
        console.error("Failed to load profile activity:", error);
        if (!isCancelled) {
          setHuntActivities([]);
          setProfileError("Could not load your profile activity right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsProfileLoading(false);
        }
      }
    };

    fetchProfileActivity();

    return () => {
      isCancelled = true;
    };
  }, [address, chainId, contractAddress, contract, participatedHunts]);

  const totals = useMemo(() => {
    return huntActivities.reduce(
      (accumulator, activity) => {
        accumulator.hunts += 1;
        accumulator.cluesSolved += activity.solvedAttestations.length;
        accumulator.solveAttestations += activity.solvedAttestations.length;
        accumulator.attemptAttestations += activity.attemptAttestations.filter(
          (attestation) => attestation.clueIndex > 0
        ).length;
        accumulator.totalTime += activity.solvedAttestations.reduce(
          (sum, attestation) => sum + attestation.timeTaken,
          0
        );
        return accumulator;
      },
      {
        hunts: 0,
        cluesSolved: 0,
        attemptAttestations: 0,
        solveAttestations: 0,
        totalTime: 0,
      }
    );
  }, [huntActivities]);

  const toggleHunt = (huntId: number) => {
    setExpandedHunts((previous) => ({
      ...previous,
      [huntId]: !previous[huntId],
    }));
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      toast.error(`Could not copy ${label}`);
    }
  };

  if (!address) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 text-green drop-shadow-xl">
          Profile
        </h1>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Connect your wallet</CardTitle>
            <CardDescription className="text-foreground/70">
              Sign in by connecting your wallet to view your hunts, attestations,
              and progress on the currently selected chain.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isValidContractAddress(contractAddress)) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 text-green drop-shadow-xl">
          Profile
        </h1>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">No contract on this network</CardTitle>
            <CardDescription className="text-foreground/70">
              The selected network does not have a configured hunt contract yet.
              Switch networks to view your profile activity.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!BACKEND_URL) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 text-green drop-shadow-xl">
          Profile
        </h1>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Backend URL missing</CardTitle>
            <CardDescription className="text-foreground/70">
              VITE_PUBLIC_BACKEND_URL is not configured, so profile attestations
              cannot be fetched.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isHuntsLoading || isProfileLoading) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 text-green drop-shadow-xl">
          Profile
        </h1>
        <Loader
          text="Loading your profile..."
          subtext="Fetching hunts and attestations for this chain."
          showAnimation={true}
        />
      </div>
    );
  }

  if (huntsError || profileError) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 text-green drop-shadow-xl">
          Profile
        </h1>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Could not load profile</CardTitle>
            <CardDescription className="text-foreground/70">
              {profileError || huntsError?.message || "Something went wrong."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (participatedHunts.length === 0) {
    return (
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-[90px]">
        <h1 className="text-3xl font-bold mt-12 mb-6 text-green drop-shadow-xl">
          Profile
        </h1>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl">No hunts joined on {currentNetwork}</CardTitle>
            <CardDescription className="text-foreground/70">
              Register for a hunt from the Hunts page to start tracking your
              attestations and progress timeline here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/hunts">Explore Hunts</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-[90px]">
      <h1 className="text-3xl font-bold mt-12 mb-2 text-green drop-shadow-xl">
        Profile
      </h1>
      <p className="text-sm text-foreground/70 mb-6">
        Chain: <span className="font-semibold">{currentNetwork}</span> • Wallet:{" "}
        <span className="font-mono">{formatAddress(address)}</span>
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white">
          <CardContent className="py-5">
            <p className="text-xs text-foreground/70">Hunts joined</p>
            <p className="text-2xl font-bold">{totals.hunts}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="py-5">
            <p className="text-xs text-foreground/70">Clues solved</p>
            <p className="text-2xl font-bold">{totals.cluesSolved}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="py-5">
            <p className="text-xs text-foreground/70">Attempt attestations</p>
            <p className="text-2xl font-bold">{totals.attemptAttestations}</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="py-5">
            <p className="text-xs text-foreground/70">Total solve time</p>
            <p className="text-2xl font-bold">{formatDuration(totals.totalTime)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        {huntActivities.map((activity) => {
          const isExpanded = Boolean(expandedHunts[activity.huntId]);

          return (
            <Card key={activity.huntId} className="bg-white">
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MdOutlineTravelExplore className="h-5 w-5" />
                      {activity.hunt.name}
                    </CardTitle>
                    <CardDescription className="text-foreground/70 mt-1">
                      {formatDateRange(activity.hunt.startTime, activity.hunt.endTime)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">
                      {activity.hunt.teamsEnabled ? "Team Hunt" : "Solo Hunt"}
                    </Badge>
                    <Badge>
                      {activity.isHuntCompleted
                        ? "Completed"
                        : `Next clue: ${activity.nextClue || 1}`}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{activity.hunt.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-foreground/70">
                  <span>Team identifier: {activity.teamIdentifier}</span>
                  <span>Solve attestations: {activity.solvedAttestations.length}</span>
                  <span>
                    Attempt attestations:{" "}
                    {
                      activity.attemptAttestations.filter(
                        (attestation) => attestation.clueIndex > 0
                      ).length
                    }
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="neutral">
                    <Link to={`/hunt/${activity.huntId}`}>Open hunt</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleHunt(activity.huntId)}
                  >
                    {isExpanded ? (
                      <>
                        Hide timeline <BsChevronUp />
                      </>
                    ) : (
                      <>
                        Show timeline <BsChevronDown />
                      </>
                    )}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="neutral">
                        <a
                          href={buildScanSearchUrl(activity.teamIdentifier)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Search team id on Sign Scan <BsBoxArrowUpRight />
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="neutral">
                        <a
                          href={buildScanSearchUrl(address)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Search wallet on Sign Scan <BsBoxArrowUpRight />
                        </a>
                      </Button>
                      {activity.clueSchemaId && (
                        <Button asChild size="sm" variant="neutral">
                          <a
                            href={buildScanSearchUrl(activity.clueSchemaId)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Search clue schema id <BsBoxArrowUpRight />
                          </a>
                        </Button>
                      )}
                      {activity.retrySchemaId && (
                        <Button asChild size="sm" variant="neutral">
                          <a
                            href={buildScanSearchUrl(activity.retrySchemaId)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Search retry schema id <BsBoxArrowUpRight />
                          </a>
                        </Button>
                      )}
                    </div>

                    {activity.timeline.length === 0 ? (
                      <Card className="bg-muted">
                        <CardContent className="py-4 text-sm text-foreground/70">
                          No attestations found yet for this hunt.
                        </CardContent>
                      </Card>
                    ) : (
                      <ol className="space-y-3">
                        {activity.timeline.map((event, index) => (
                          <li
                            key={`${event.type}-${event.clueIndex}-${event.timestamp}-${event.attestationId || index}`}
                            className="rounded-lg border-2 border-border bg-muted p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-semibold">
                                {getTimelineIcon(event.type)}
                                <span>{getTimelineLabel(event)}</span>
                              </div>
                              <span className="text-xs text-foreground/70">
                                {formatTimestamp(event.timestamp)}
                              </span>
                            </div>

                            <div className="mt-2 text-xs text-foreground/75 flex flex-wrap gap-x-4 gap-y-1">
                              {event.attemptCount !== undefined && (
                                <span>Attempt count: {event.attemptCount}</span>
                              )}
                              {event.timeTaken !== undefined && (
                                <span>Time taken: {formatDuration(event.timeTaken)}</span>
                              )}
                              {event.solverAddress && (
                                <span>Solver: {formatAddress(event.solverAddress)}</span>
                              )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {event.attestationId && (
                                <>
                                  <Button asChild size="sm" variant="outline">
                                    <a
                                      href={buildAttestationUrl(event.attestationId)}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      View attestation <BsBoxArrowUpRight />
                                    </a>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      copyToClipboard(
                                        event.attestationId || "",
                                        "Attestation ID"
                                      )
                                    }
                                  >
                                    Copy attestation id
                                  </Button>
                                </>
                              )}
                              {event.schemaId && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyToClipboard(event.schemaId || "", "Schema ID")
                                  }
                                >
                                  Copy schema id
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
