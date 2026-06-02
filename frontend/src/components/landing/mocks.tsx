import { useRef, type ReactNode } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { BsCheckCircle, BsGeoAlt } from 'react-icons/bs';
import { FaTrophy } from 'react-icons/fa';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function FieldNote({
  children,
  className = '',
  rotate = 0,
  parallaxY,
  reducedMotion,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
  parallaxY?: MotionValue<number>;
  reducedMotion: boolean | null;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        rotate,
        y: reducedMotion ? 0 : parallaxY,
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: reducedMotion ? 0.15 : 0.5 }}
      whileHover={reducedMotion ? undefined : { scale: 1.02, rotate: rotate + 1 }}
    >
      {children}
    </motion.div>
  );
}

function ClueMock() {
  return (
    <Card className="w-[280px] sm:w-[300px] bg-white border-2 border-border shadow-shadow">
      <CardHeader className="bg-main text-main-foreground p-4 -my-6">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-lg">City Explorer Hunt</CardTitle>
            <div className="text-lg font-heading"># 2/5</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-8">
        <h3 className="text-lg font-semibold mb-2">Clue</h3>
        <p className="text-base text-foreground/80 leading-relaxed">
          Frame the hill where every PC went to rest. Capture the rolling green under a blue sky.
        </p>
      </CardContent>
      <CardFooter className="border-t pt-4 flex flex-col gap-3 px-4 pb-4">
        <div className="flex justify-between text-sm text-foreground/70 w-full">
          <span className="flex items-center gap-1">
            <BsGeoAlt />
            Location detected
          </span>
          <span>Attempts remaining: 6/6</span>
        </div>
        <Button className="w-full">Verify location</Button>
      </CardFooter>
    </Card>
  );
}

function VerifiedMock() {
  return (
    <div className="w-[240px] sm:w-[260px] bg-parchment-panel border-2 border-border rounded-base p-4 shadow-shadow">
      <div className="flex items-center gap-2 text-chart-4 font-heading text-lg">
        <BsCheckCircle className="w-6 h-6 shrink-0" />
        <span>Correct answer, clue solved!</span>
      </div>
      <p className="text-sm text-foreground/60 mt-2">On to the next waypoint.</p>
    </div>
  );
}

function HuddleMock() {
  const tiles = ['You', 'Alex', 'Sam', '+1'];
  return (
    <div className="w-[220px] sm:w-[240px] bg-ink text-white border-2 border-ink-soft rounded-base p-3 shadow-shadow">
      <p className="text-xs uppercase tracking-wider text-white/60 mb-2 font-heading">Team huddle</p>
      <div className="grid grid-cols-2 gap-2">
        {tiles.map((label) => (
          <div
            key={label}
            className="aspect-video rounded-base bg-ink-soft border border-white/20 flex items-center justify-center text-xs font-medium"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardMock() {
  const rows = [
    { rank: 1, team: 'Trail Blazers', clues: 5, score: 892 },
    { rank: 2, team: 'Map Readers', clues: 4, score: 1045 },
    { rank: 3, team: 'Night Owls', clues: 4, score: 1180 },
  ];

  return (
    <Card className="w-[280px] sm:w-[300px] bg-white border-2 border-border shadow-shadow overflow-hidden">
      <CardHeader className="bg-main text-main-foreground p-3 text-center">
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          <FaTrophy className="w-4 h-4" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-secondary-background">
              <th className="p-2 text-left font-heading">Rank</th>
              <th className="p-2 text-left font-heading">Team</th>
              <th className="p-2 text-center font-heading">Clues</th>
              <th className="p-2 text-right font-heading">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team} className="border-b border-border/40">
                <td className="p-2">{row.rank}</td>
                <td className="p-2 font-medium">{row.team}</td>
                <td className="p-2 text-center">{row.clues}</td>
                <td className="p-2 text-right text-chart-4 font-semibold">{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-foreground/50 p-2 text-center">
          Score = Time + Attempts × 5
        </p>
      </CardContent>
    </Card>
  );
}

export function FieldNotes() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], [20, -60]);
  const y3 = useTransform(scrollYProgress, [0, 1], [60, -20]);
  const y4 = useTransform(scrollYProgress, [0, 1], [30, -50]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[680px] sm:min-h-[720px] md:min-h-[640px] mx-auto max-w-5xl"
    >
      <FieldNote
        className="left-1/2 -translate-x-1/2 top-0 md:left-[8%] md:translate-x-0 z-20"
        rotate={-3}
        parallaxY={y1}
        reducedMotion={reducedMotion}
      >
        <ClueMock />
      </FieldNote>

      <FieldNote
        className="right-2 top-[200px] md:right-[12%] md:top-[60px] z-30"
        rotate={4}
        parallaxY={y2}
        reducedMotion={reducedMotion}
      >
        <VerifiedMock />
      </FieldNote>

      <FieldNote
        className="left-2 top-[380px] md:left-[18%] md:top-[280px] z-10"
        rotate={-2}
        parallaxY={y3}
        reducedMotion={reducedMotion}
      >
        <HuddleMock />
      </FieldNote>

      <FieldNote
        className="right-1/2 translate-x-1/2 bottom-4 md:right-[8%] md:translate-x-0 md:bottom-8 md:top-auto z-20"
        rotate={2}
        parallaxY={y4}
        reducedMotion={reducedMotion}
      >
        <LeaderboardMock />
      </FieldNote>
    </div>
  );
}
