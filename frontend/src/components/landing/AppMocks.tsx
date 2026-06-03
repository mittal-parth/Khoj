import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BsArrowClockwise,
  BsCalendar2DateFill,
  BsCamera,
  BsGeoAlt,
  BsCheckCircle,
  BsBarChartFill,
  BsSkipForward,
} from 'react-icons/bs';
import { FaChess, FaCoins, FaRegClock, FaCheckCircle, FaMedal, FaTrophy } from 'react-icons/fa';
import { TbChessKnight, TbUsersGroup } from 'react-icons/tb';
import { IoIosPeople } from 'react-icons/io';
import { FiRefreshCw } from 'react-icons/fi';
import { Link2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MockScreen } from './MockScreen';
import type { MockProps } from './journey';

const DOCS_URL = 'https://docs.playkhoj.com';
const BLISS_COORDS = '37.4030° N, 122.0696° W';

/** Shared clue copy for geo + image hunt mocks in the Crack the clue section */
const MOCK_CLUE_TEXT =
  'Frame the hill where every PC went to rest — rolling green under a blue sky, waiting at the edge of Sonoma County.';

const MEMBERS = [
  { seed: '0xE6eD…0c44', owner: true },
  { seed: '0x4b1d…8f0a', owner: false },
] as const;

function VerifiedBlissImage() {
  return (
    <img
      src="/landing/bliss.png"
      alt="Bliss hills wallpaper (Windows XP)"
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}

function MemberAvatar({ seed, isOwner }: { seed: string; isOwner?: boolean }) {
  return (
    <div className="relative shrink-0">
      <img
        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`}
        alt=""
        className="w-8 h-8 rounded-lg border-2 border-border bg-white"
      />
      {isOwner && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-main rounded-full border-2 border-border flex items-center justify-center text-[7px]">
          👑
        </div>
      )}
    </div>
  );
}

function HuntCardProduction({
  name,
  description,
  icon,
  iconBg,
  teams,
  dateLabel,
  participants,
  cta,
  className,
}: {
  name: string;
  description: string;
  icon: ReactNode;
  iconBg: string;
  teams?: boolean;
  dateLabel: string;
  participants: string;
  cta: string;
  className?: string;
}) {
  return (
    <Card className={cn('bg-white overflow-hidden py-0 gap-0 shadow-shadow', className)}>
      <div className="flex min-h-[168px]">
        <div
          className={`w-1/4 flex items-center justify-center border-r-2 border-border ${iconBg}`}
        >
          {icon}
        </div>
        <CardContent className="w-3/4 p-3 flex flex-col justify-between gap-1.5">
          <div className="flex justify-between items-start gap-1">
            <h3 className="text-[13px] font-semibold leading-tight">{name}</h3>
            {teams && (
              <Badge variant="neutral" className="text-[8px] px-1.5 py-0 shrink-0 h-auto gap-0.5">
                <TbUsersGroup className="w-2.5 h-2.5" />
                Teams
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-foreground/70 leading-snug line-clamp-2">{description}</p>
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-main rounded-base border-2 border-border shrink-0">
              <BsCalendar2DateFill className="w-3 h-3" />
            </div>
            <span className="text-[9px] text-foreground/80 leading-tight">{dateLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-main rounded-base border-2 border-border shrink-0">
              <IoIosPeople className="w-3 h-3" />
            </div>
            <span className="text-[9px] text-foreground/80">{participants}</span>
          </div>
          <Button className="w-full h-8 text-[11px] font-bold" disabled>
            {cta}
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}

/** Hero — production-style hunts list, cards fill the screen */
export function HuntsListHeroMock(_props: MockProps) {
  return (
    <MockScreen>
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <h2 className="text-base font-bold text-green drop-shadow-sm px-0.5 shrink-0">Hunts</h2>
        <HuntCardProduction
          name="Base India: Rajasthan Hunt"
          description="Explore the Pink City through riddles that lead to real landmarks."
          icon={<FaChess className="w-8 h-8 text-white" />}
          iconBg="bg-chart-3"
          teams
          dateLabel="Oct 17 06:30 AM – Nov 7 06:30 AM"
          participants="24 participants"
          cta="Register"
        />
        <HuntCardProduction
          name="Photo Safari"
          description="Image-based clues — capture landmarks on camera to verify."
          icon={<TbChessKnight className="w-7 h-7 text-white" />}
          iconBg="bg-chart-4"
          dateLabel="May 15 10:00 AM – May 30 08:00 PM"
          participants="12 participants"
          cta="Register"
          className="opacity-95"
        />
      </div>
    </MockScreen>
  );
}

/** Compact team view — fits 448px phone viewport */
export function TeamMock(_props: MockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DOCS_URL);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <MockScreen>
      <div className="flex-1 min-h-0 flex flex-col">
        <Card className="bg-white py-0 gap-0 shadow-shadow flex-1 min-h-0 flex flex-col overflow-hidden">
          <CardHeader className="p-2 border-b-2 border-border shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold">Team Management</CardTitle>
              <Button variant="neutral" size="sm" className="h-6 w-6 p-0" disabled>
                <FiRefreshCw className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2 flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
            <div className="flex justify-between items-center text-[10px] shrink-0">
              <span className="font-semibold">Team: Trail Blazers</span>
              <span className="font-bold">2/2</span>
            </div>
            <div className="space-y-1 shrink-0">
              {MEMBERS.map((m) => (
                <div
                  key={m.seed}
                  className="flex items-center gap-2 p-2 bg-muted rounded-lg border-2 border-border shadow-shadow"
                >
                  <MemberAvatar seed={m.seed} isOwner={m.owner} />
                  <span className="text-[9px] font-semibold truncate">{m.seed}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto shrink-0 space-y-1">
              <p className="text-[10px] font-semibold">Team Invite Code</p>
              <div className="p-2 bg-muted rounded-lg border-2 border-border flex items-center gap-2">
                <QRCode value={DOCS_URL} size={56} className="shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <div className="text-[7px] font-mono px-1.5 py-1 bg-white border-2 border-border rounded-base truncate">
                    docs.playkhoj.com
                  </div>
                  <Button
                    variant="neutral"
                    size="sm"
                    className="h-6 px-2 text-[8px] w-full"
                    onClick={handleCopy}
                  >
                    <Link2 className="w-2.5 h-2.5 mr-0.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-2 border-t-2 border-border shrink-0">
            <Button className="w-full h-8 text-[10px]" disabled>
              Start Hunt
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MockScreen>
  );
}

export function ClueGeoMock({ interactive = false }: MockProps) {
  const [phase, setPhase] = useState<'idle' | 'coords' | 'success'>('idle');

  useEffect(() => {
    if (phase === 'coords') {
      const timer = window.setTimeout(() => setPhase('success'), 900);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'success') {
      const timer = window.setTimeout(() => setPhase('idle'), 3500);
      return () => window.clearTimeout(timer);
    }
  }, [phase]);

  const handleVerify = () => {
    if (!interactive || phase !== 'idle') return;
    setPhase('coords');
  };

  const footerContent =
    phase === 'coords' ? (
      <div className="w-full text-center space-y-1 py-1">
        <p className="text-[9px] font-mono text-chart-4 font-semibold">{BLISS_COORDS}</p>
        <p className="text-[8px] text-foreground/50">Pinning location…</p>
      </div>
    ) : phase === 'success' ? (
      <div className="w-full text-center space-y-1 py-0.5">
        <BsCheckCircle className="w-6 h-6 text-chart-4 mx-auto" />
        <p className="text-[10px] font-bold text-chart-4">Correct answer, clue solved!</p>
      </div>
    ) : (
      <>
        <div className="flex justify-between text-[10px] text-foreground/70 w-full">
          <span className="flex items-center gap-0.5">
            <BsGeoAlt className="w-3 h-3" />
            Location detected
          </span>
          <span>Attempts remaining: 6/6</span>
        </div>
        <Button
          className="w-full h-9 text-[11px]"
          disabled={!interactive}
          onClick={handleVerify}
        >
          Verify Location
        </Button>
      </>
    );

  return (
    <MockScreen>
      <Card className="bg-white py-0 gap-0 overflow-hidden flex-1 min-h-0 flex flex-col shadow-shadow">
        <CardHeader className="bg-main text-main-foreground p-3 border-b-2 border-border shrink-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <CardTitle className="text-xs font-bold leading-tight">City Explorer Hunt</CardTitle>
              <div className="text-sm font-heading mt-0.5"># 2/5</div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="neutral" size="sm" className="h-7 w-7 p-0" disabled>
                <BsSkipForward className="w-3.5 h-3.5" />
              </Button>
              <Button variant="neutral" size="sm" className="h-7 w-7 p-0" disabled>
                <BsArrowClockwise className="w-3.5 h-3.5" />
              </Button>
              <Button variant="neutral" size="sm" className="h-7 w-7 p-0" disabled>
                <BsBarChartFill className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col justify-center p-4">
          <h3 className="text-sm font-semibold mb-2">Clue</h3>
          <p className="text-[11px] text-foreground/85 leading-relaxed text-left">
            {MOCK_CLUE_TEXT}
          </p>
        </CardContent>
        <CardFooter className="border-t-2 border-border p-3 flex flex-col gap-2 shrink-0 min-h-[88px] justify-center">
          {footerContent}
        </CardFooter>
      </Card>
    </MockScreen>
  );
}

export function ImageCaptureMock({ interactive = false }: MockProps) {
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!verified) return;
    const timer = window.setTimeout(() => setVerified(false), 3000);
    return () => window.clearTimeout(timer);
  }, [verified]);

  const handleVerify = () => {
    if (interactive) setVerified(true);
  };

  return (
    <MockScreen>
      <Card className="bg-white py-0 gap-0 overflow-hidden flex-1 min-h-0 flex flex-col shadow-shadow">
        <CardHeader className="bg-main text-main-foreground p-3 border-b-2 border-border shrink-0">
          <CardTitle className="text-xs font-bold">Photo Safari</CardTitle>
          <div className="text-sm font-heading"># 3/5</div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col justify-center p-3 gap-2">
          <h3 className="text-sm font-semibold">Clue</h3>
          <p className="text-[11px] text-foreground/85 leading-relaxed text-left">
            {MOCK_CLUE_TEXT}
          </p>
          <div className="rounded-base border-2 border-border overflow-hidden aspect-[4/3] bg-muted relative">
            <AnimatePresence mode="wait">
              {verified ? (
                <motion.div
                  key="verified"
                  initial={{ opacity: 0, rotate: -8, scale: 0.92 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <VerifiedBlissImage />
                </motion.div>
              ) : (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <BsCamera className="w-8 h-8 text-foreground/25" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
        <CardFooter className="border-t-2 border-border p-3 flex gap-2 shrink-0">
          <Button variant="outline" className="flex-1 h-8 text-[10px]" disabled={!interactive || verified}>
            Retry
          </Button>
          <Button
            className="flex-1 h-8 text-[10px]"
            disabled={!interactive || verified}
            onClick={handleVerify}
          >
            Verify Image
          </Button>
        </CardFooter>
      </Card>
    </MockScreen>
  );
}

/** Modal-style leaderboard overlay */
export function LeaderboardMock(_props: MockProps) {
  const rows = [
    { rank: 1, team: 'Trail Blazers', clues: 5, score: 892, medal: 'gold' as const },
    { rank: 2, team: 'Map Readers', clues: 4, score: 1045, medal: 'silver' as const },
    { rank: 3, team: 'Night Owls', clues: 4, score: 1180, medal: 'bronze' as const },
  ];

  return (
    <MockScreen className="bg-black/50 items-center justify-center">
      <Card className="w-full bg-white py-0 gap-0 shadow-shadow max-h-full overflow-hidden flex flex-col min-h-0">
        <CardHeader className="bg-main text-main-foreground p-2.5 text-center border-b-2 border-border shrink-0">
          <CardTitle className="text-[11px] flex items-center justify-center gap-1 font-bold">
            <FaTrophy className="w-3 h-3" />
            Leaderboard
          </CardTitle>
          <p className="text-[8px] uppercase tracking-wide opacity-70">City Explorer Hunt</p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b-2 border-border bg-secondary-background">
                <th className="p-1.5 text-left">Rank</th>
                <th className="p-1.5 text-left">Team</th>
                <th className="p-1.5 text-center">Clues</th>
                <th className="p-1.5 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.team} className="border-b border-border/30">
                  <td className="p-1.5">
                    {row.medal === 'gold' && <FaTrophy className="w-3 h-3 text-yellow-500" />}
                    {row.medal === 'silver' && <FaMedal className="w-3 h-3 text-gray-400" />}
                    {row.medal === 'bronze' && <FaMedal className="w-3 h-3 text-orange-600" />}
                  </td>
                  <td className="p-1.5 font-medium truncate max-w-[72px]">{row.team}</td>
                  <td className="p-1.5 text-center">{row.clues}</td>
                  <td className="p-1.5 text-right text-chart-4 font-semibold">{row.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[7px] text-foreground/50 p-1.5 text-center">
            Score = (Time in minutes) + (Attempts × 5)
          </p>
        </CardContent>
      </Card>
    </MockScreen>
  );
}

export function RewardMock(_props: MockProps) {
  const score = 892;
  const progress = 89.2;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  return (
    <MockScreen>
      <Card className="bg-white py-0 gap-0 shadow-shadow flex-1 min-h-0 flex flex-col overflow-hidden">
        <CardHeader className="bg-main text-main-foreground px-3 py-2 border-b-2 border-border shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[11px] font-bold">City Explorer Hunt</CardTitle>
            <Button variant="neutral" size="sm" className="h-6 w-6 p-0" disabled>
              <BsBarChartFill className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center gap-5 px-3 py-4">
          <div className="text-center shrink-0 space-y-2">
            <p className="text-2xl leading-none" aria-hidden>
              🏆
            </p>
            <h2 className="text-sm font-bold leading-tight">Treasure Found!</h2>
            <p className="text-[9px] text-foreground/65 leading-relaxed max-w-[200px] mx-auto">
              All challenges complete. Contact organizers for next steps.
            </p>
          </div>

          <Card className="bg-muted py-0 gap-0 shadow-shadow shrink-0">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-main rounded-base border-2 border-border shrink-0">
                    <FaRegClock className="w-2.5 h-2.5 text-main-foreground" />
                  </div>
                  <span className="text-[7px] text-foreground/60 font-semibold uppercase tracking-wide">
                    Speed
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="p-1 bg-main rounded-base border-2 border-border shrink-0">
                    <FaCheckCircle className="w-2.5 h-2.5 text-main-foreground" />
                  </div>
                  <span className="text-[7px] text-foreground/60 font-semibold uppercase tracking-wide">
                    Accuracy
                  </span>
                </div>
              </div>
              <div className="relative flex items-center justify-center py-1">
                <svg className="w-[88px] h-[88px] -rotate-90">
                  <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    className="stroke-foreground/20"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="44"
                    cy="44"
                    r={radius}
                    className="stroke-main"
                    strokeWidth="5"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress / 100)}
                  />
                </svg>
                <span className="absolute text-2xl font-bold text-main">{score}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-accent py-0 gap-0 shadow-shadow shrink-0">
            <CardContent className="p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 bg-main rounded-base border-2 border-border shrink-0">
                <FaCoins className="w-3.5 h-3.5 text-main-foreground" />
              </div>
              <div>
                <p className="text-[7px] font-heading uppercase text-accent-foreground/65">Your Reward</p>
                <p className="text-sm font-bold text-accent-foreground">Swags!! 🎁</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </MockScreen>
  );
}
