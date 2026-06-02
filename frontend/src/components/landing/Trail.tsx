import { useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { TRAIL_STEPS } from './data';

const DESKTOP_PATH =
  'M 80 40 C 180 40, 220 80, 280 120 S 420 180, 380 260 S 300 340, 420 400 S 560 460, 480 540 S 340 620, 520 680';

const MOBILE_PATH = 'M 48 40 L 48 720';

function WaypointContent({ step }: { step: (typeof TRAIL_STEPS)[number] }) {
  return (
    <div className="flex gap-3 items-start min-w-0">
      <div className="shrink-0 w-10 h-10 rounded-full bg-main border-2 border-border shadow-shadow flex items-center justify-center font-heading text-sm">
        {step.number}
      </div>
      <div className="bg-parchment-panel border-2 border-border rounded-base p-3 shadow-shadow min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-chart-2">{step.icon}</span>
          <h3 className="font-heading text-base md:text-lg">{step.title}</h3>
        </div>
        <p className="text-sm text-foreground/70 leading-snug">{step.description}</p>
      </div>
    </div>
  );
}

function AnimatedWaypoint({
  step,
  index,
  total,
  scrollProgress,
  reducedMotion,
  className,
}: {
  step: (typeof TRAIL_STEPS)[number];
  index: number;
  total: number;
  scrollProgress: MotionValue<number>;
  reducedMotion: boolean | null;
  className?: string;
}) {
  const threshold = (index + 0.5) / total;
  const opacity = useTransform(scrollProgress, [threshold - 0.08, threshold], [0.3, 1]);
  const scale = useTransform(scrollProgress, [threshold - 0.08, threshold], [0.85, 1]);

  return (
    <motion.div
      className={className}
      style={{
        opacity: reducedMotion ? 1 : opacity,
        scale: reducedMotion ? 1 : scale,
      }}
    >
      <WaypointContent step={step} />
    </motion.div>
  );
}

export function Trail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const pathLength = useTransform(scrollYProgress, [0.05, 0.85], [0, 1]);

  const desktopPositions = [
    'left-[4%] top-[2%]',
    'left-[32%] top-[12%]',
    'left-[52%] top-[28%]',
    'left-[38%] top-[44%]',
    'left-[58%] top-[58%]',
    'left-[42%] top-[78%]',
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop winding trail */}
      <div className="hidden md:block relative min-h-[720px]">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 600 720"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <motion.path
            d={DESKTOP_PATH}
            fill="none"
            stroke="var(--chart-3)"
            strokeWidth="3"
            strokeDasharray="12 8"
            strokeLinecap="round"
            style={{ pathLength: reducedMotion ? 1 : pathLength }}
          />
        </svg>

        {TRAIL_STEPS.map((step, index) => (
          <AnimatedWaypoint
            key={step.number}
            step={step}
            index={index}
            total={TRAIL_STEPS.length}
            scrollProgress={scrollYProgress}
            reducedMotion={reducedMotion}
            className={`absolute z-10 w-[calc(100%-2rem)] max-w-sm ${desktopPositions[index]}`}
          />
        ))}
      </div>

      {/* Mobile vertical trail */}
      <div className="md:hidden relative pl-14 pr-2 pb-4">
        <svg
          className="absolute left-4 top-0 h-full w-8 pointer-events-none"
          viewBox="0 0 96 760"
          preserveAspectRatio="xMidYMin meet"
          aria-hidden
        >
          <motion.path
            d={MOBILE_PATH}
            fill="none"
            stroke="var(--chart-3)"
            strokeWidth="3"
            strokeDasharray="12 8"
            strokeLinecap="round"
            style={{ pathLength: reducedMotion ? 1 : pathLength }}
          />
        </svg>

        <div className="flex flex-col gap-10 pt-4">
          {TRAIL_STEPS.map((step, index) => (
            <AnimatedWaypoint
              key={step.number}
              step={step}
              index={index}
              total={TRAIL_STEPS.length}
              scrollProgress={scrollYProgress}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
