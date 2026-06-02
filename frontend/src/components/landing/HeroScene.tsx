import { useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KhojLogo } from './KhojLogo';

const MOUNTAIN_LAYERS = [
  {
    d: 'M0,420 C200,380 320,400 480,360 S720,300 960,340 L960,600 L0,600 Z',
    fill: 'var(--ink-soft)',
    opacity: 0.08,
  },
  {
    d: 'M0,460 C180,420 360,440 540,400 S780,360 960,390 L960,600 L0,600 Z',
    fill: 'var(--ink-soft)',
    opacity: 0.12,
  },
  {
    d: 'M0,500 C240,470 400,490 560,450 S760,420 960,440 L960,600 L0,600 Z',
    fill: 'var(--ink)',
    opacity: 0.14,
  },
  {
    d: 'M0,530 C200,510 420,520 600,490 S820,470 960,500 L960,600 L0,600 Z',
    fill: 'var(--main)',
    opacity: 0.35,
  },
];

const TRAIL_PATH =
  'M 80 520 C 200 480, 320 500, 440 460 S 640 420, 760 450 S 880 470, 920 490';

const CONTOUR_LINES = [
  'M -40 180 Q 200 120, 440 160 T 920 140',
  'M -40 240 Q 220 200, 480 220 T 960 200',
  'M -40 300 Q 180 260, 420 280 T 900 260',
];

interface HeroSceneProps {
  onLaunch: () => void;
  onScrollToTrail: () => void;
}

export function HeroScene({ onLaunch, onScrollToTrail }: HeroSceneProps) {
  const reducedMotion = useReducedMotion();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 40, damping: 22 });
  const smoothY = useSpring(mouseY, { stiffness: 40, damping: 22 });

  const bgX = useTransform(smoothX, [-0.5, 0.5], [-20, 20]);
  const bgY = useTransform(smoothY, [-0.5, 0.5], [-12, 12]);

  const ridgeX = useTransform(smoothX, [-0.5, 0.5], [-22, 22]);
  const ridgeY = useTransform(smoothY, [-0.5, 0.5], [-6, 6]);
  const midX = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const midY = useTransform(smoothY, [-0.5, 0.5], [-4, 4]);
  const farX = useTransform(smoothX, [-0.5, 0.5], [-8, 8]);
  const farY = useTransform(smoothY, [-0.5, 0.5], [-2, 2]);
  const backX = useTransform(smoothX, [-0.5, 0.5], [-4, 4]);
  const backY = useTransform(smoothY, [-0.5, 0.5], [-1, 1]);

  const layerMotion = [
    { x: backX, y: backY },
    { x: farX, y: farY },
    { x: midX, y: midY },
    { x: ridgeX, y: ridgeY },
  ];

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (reducedMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      mouseX.set((event.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((event.clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY, reducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <section
      id="hero"
      className="relative min-h-[100svh] flex flex-col overflow-hidden bg-parchment"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: reducedMotion ? 0 : bgX, y: reducedMotion ? 0 : bgY }}
        aria-hidden
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 960 600"
          preserveAspectRatio="xMidYMid slice"
        >
          {CONTOUR_LINES.map((d, i) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="var(--ink-soft)"
              strokeWidth="1"
              opacity={0.12 + i * 0.04}
            />
          ))}
        </svg>
      </motion.div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-28 pb-36 text-center min-w-0">
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.7 }}
          className="max-w-3xl min-w-0"
        >
          <KhojLogo size="lg" className="mx-auto mb-6 md:mb-8" />

          <h1 className="text-[clamp(2.25rem,6.5vw,4.5rem)] font-heading text-ink leading-[1.05] tracking-tight overflow-wrap-anywhere min-w-0">
            Your city is hiding something.
          </h1>

          <p className="mt-5 text-lg md:text-xl text-ink-soft/90 max-w-lg mx-auto leading-relaxed">
            Real clues. Real places. Onchain rewards.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-9">
            <Button size="lg" onClick={onLaunch} className="text-base px-7">
              Start Exploring
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-base px-7 text-ink hover:bg-ink/5"
              onClick={onScrollToTrail}
            >
              Follow the trail
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[55%] min-h-[280px] pointer-events-none" aria-hidden>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 960 600"
          preserveAspectRatio="xMidYMax slice"
        >
          {MOUNTAIN_LAYERS.map((layer, index) => (
            <motion.g
              key={layer.d}
              style={{
                x: reducedMotion ? 0 : layerMotion[index].x,
                y: reducedMotion ? 0 : layerMotion[index].y,
              }}
            >
              <path d={layer.d} fill={layer.fill} opacity={layer.opacity} />
            </motion.g>
          ))}

          <motion.path
            d={TRAIL_PATH}
            fill="none"
            stroke="var(--chart-3)"
            strokeWidth="2.5"
            strokeDasharray="10 8"
            strokeLinecap="round"
            opacity="0.7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reducedMotion ? 0.15 : 2.2, ease: 'easeInOut', delay: 0.3 }}
          />
        </svg>
      </div>

      <motion.button
        type="button"
        onClick={onScrollToTrail}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-ink-soft/60 hover:text-ink transition-colors z-20"
        animate={reducedMotion ? undefined : { y: [0, 5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        aria-label="Scroll to trail"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <ChevronDown className="w-5 h-5" />
      </motion.button>
    </section>
  );
}
