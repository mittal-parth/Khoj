/* Hallmark · macrostructure: Scroll Journey · tone: playful · anchor hue: yellow-green */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { markNavigatingFromLanding } from '@/utils/pwaUtils';
import { KhojLogo } from '@/components/landing/KhojLogo';
import { cn } from '@/lib/utils';
import { LandingNav, LandingFooter, LandingCta } from '@/components/landing/LandingShell';
import { PhoneFrame } from '@/components/landing/PhoneFrame';
import { HERO_MOCK, JOURNEY_MOCKS, ClueGeo, ClueImage } from '@/components/landing/mockRegistry';
import {
  JOURNEY_STEPS,
  CLUE_SECTION_STYLE,
  CLUE_STEP,
  DEMO_VIDEO_URL,
  type JourneyStep,
} from '@/components/landing/journey';
import { USE_CASES, type UseCase } from '@/components/landing/data';

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function journeyLayout(stepIndex: number) {
  const mockOnRight = stepIndex % 2 === 0;
  return {
    mockOnRight,
    textOrder: mockOnRight ? 'lg:order-1' : 'lg:order-2 lg:text-right',
    mockOrder: mockOnRight ? 'lg:order-2' : 'lg:order-1',
    textAlignRight: !mockOnRight,
    textAnimX: mockOnRight ? -28 : 28,
  };
}

function scrollFade(
  reducedMotion: boolean | null,
  {
    delay = 0,
    y = 20,
    x = 0,
    scale = 1,
  }: { delay?: number; y?: number; x?: number; scale?: number } = {},
) {
  return {
    initial: {
      opacity: 0,
      y: reducedMotion ? 0 : y,
      x: reducedMotion ? 0 : x,
      scale: reducedMotion ? 1 : scale,
    },
    whileInView: { opacity: 1, y: 0, x: 0, scale: 1 },
    viewport: { once: true, amount: 0.2, margin: '0px 0px -40px 0px' },
    transition: {
      duration: reducedMotion ? 0.15 : 0.55,
      ease: EASE_OUT,
      delay: reducedMotion ? 0 : delay,
    },
  };
}

function JourneyTextBlock({
  kicker,
  title,
  blurb,
  stepNumber,
  textClass,
  alignRight = false,
}: {
  kicker: string;
  title: string;
  blurb: string;
  stepNumber?: number;
  textClass: string;
  alignRight?: boolean;
}) {
  return (
    <>
      <span className={`text-sm font-heading uppercase tracking-[0.2em] ${textClass} opacity-70`}>
        {kicker}
      </span>
      <h2
        className={`mt-3 text-[clamp(1.75rem,5vw,3rem)] font-heading leading-[1.05] overflow-wrap-anywhere min-w-0 ${textClass}`}
      >
        {title}
      </h2>
      <p
        className={cn(
          'mt-4 text-base md:text-lg max-w-md opacity-80',
          textClass,
          alignRight && 'lg:ml-auto',
        )}
      >
        {blurb}
      </p>
      {stepNumber !== undefined && (
        <p
          className={cn(
            'mt-6 text-[clamp(3rem,10vw,6rem)] font-heading leading-none opacity-20',
            textClass,
            alignRight && 'lg:text-right',
          )}
        >
          {String(stepNumber).padStart(2, '0')}
        </p>
      )}
    </>
  );
}

function JourneySection({
  step,
  Mock,
  reducedMotion,
  stepIndex,
  confettiOnView = false,
}: {
  step: JourneyStep;
  Mock: (typeof JOURNEY_MOCKS)[keyof typeof JOURNEY_MOCKS];
  reducedMotion: boolean | null;
  stepIndex: number;
  confettiOnView?: boolean;
}) {
  const { textOrder, mockOrder, textAlignRight, textAnimX } = journeyLayout(stepIndex);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.35 });
  const [confettiFired, setConfettiFired] = useState(false);

  useEffect(() => {
    if (confettiOnView && inView && !confettiFired && !reducedMotion) {
      const end = Date.now() + 800;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ['#FACC00', '#7A83FF', '#FF4D50', '#00D696', '#0099FF'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ['#FACC00', '#7A83FF', '#FF4D50', '#00D696', '#0099FF'],
        });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
      setConfettiFired(true);
    }
  }, [confettiOnView, inView, confettiFired, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-screen flex items-center py-16 md:py-20 px-4 ${step.bgClass}`}
    >
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          className={cn('min-w-0 text-left', textOrder)}
          {...scrollFade(reducedMotion, {
            y: 24,
            x: textAnimX,
            delay: stepIndex * 0.04,
          })}
        >
          <JourneyTextBlock
            kicker={step.kicker}
            title={step.title}
            blurb={step.blurb}
            stepNumber={step.number}
            textClass={step.textClass}
            alignRight={textAlignRight}
          />
        </motion.div>

        <motion.div
          className={cn(mockOrder, 'flex justify-center')}
          {...scrollFade(reducedMotion, {
            y: 32,
            scale: 0.97,
            delay: 0.08 + stepIndex * 0.04,
          })}
        >
          <PhoneFrame>
            <Mock interactive={false} />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}

function ClueStepSection({
  reducedMotion,
  stepIndex,
}: {
  reducedMotion: boolean | null;
  stepIndex: number;
}) {
  const { bgClass, textClass } = CLUE_SECTION_STYLE;
  const { textOrder, mockOrder, textAlignRight, textAnimX } = journeyLayout(stepIndex);
  const [mode, setMode] = useState<'geo' | 'image'>('geo');
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setMode((m) => (m === 'geo' ? 'image' : 'geo'));
    }, 4000);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion]);

  return (
    <section className={`min-h-screen flex items-center py-16 md:py-20 px-4 ${bgClass}`}>
      <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <motion.div
          className={cn('min-w-0 text-left', textOrder)}
          {...scrollFade(reducedMotion, { x: textAnimX, delay: stepIndex * 0.04 })}
        >
          <JourneyTextBlock
            kicker={CLUE_STEP.kicker}
            title={CLUE_STEP.title}
            blurb={CLUE_STEP.blurb}
            stepNumber={2}
            textClass={textClass}
            alignRight={textAlignRight}
          />
        </motion.div>
        <motion.div
          className={cn(mockOrder, 'flex flex-col items-center gap-3')}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          {...scrollFade(reducedMotion, { y: 32, delay: 0.08 })}
        >
          <div
            className="flex rounded-base border-2 border-white/30 overflow-hidden"
            role="tablist"
            aria-label="Clue verification mode"
          >
            {(['geo', 'image'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                onClick={() => setMode(tab)}
                className={cn(
                  'px-4 py-1.5 text-xs font-heading uppercase tracking-wider transition-colors',
                  mode === tab ? 'bg-white text-ink' : 'text-white/70 hover:text-white',
                )}
              >
                {tab === 'geo' ? 'Geo' : 'Image'}
              </button>
            ))}
          </div>
          <PhoneFrame>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducedMotion ? 0.1 : 0.3, ease: EASE_OUT }}
                className="h-full w-full"
              >
                {mode === 'geo' ? (
                  <ClueGeo interactive />
                ) : (
                  <ClueImage interactive />
                )}
              </motion.div>
            </AnimatePresence>
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}

function UseCaseCard({
  useCase,
  index,
  reducedMotion,
}: {
  useCase: UseCase;
  index: number;
  reducedMotion: boolean | null;
}) {
  return (
    <motion.div {...scrollFade(reducedMotion, { delay: index * 0.05, y: 16 })}>
      <div className={useCase.tiltClass}>
        <div
          className={cn(
            'group relative text-left bg-white border-2 border-border rounded-base p-4 shadow-shadow w-full min-w-0',
            'transition-[transform,box-shadow] duration-300 ease-out',
            'hover:-translate-y-1 hover:shadow-[6px_6px_0_0_var(--border)]',
          )}
        >
          <div className={cn('w-fit p-2 rounded-base border-2 border-border mb-3', useCase.color)}>
            {useCase.icon}
          </div>
          <h3 className="font-heading text-lg leading-tight mb-2">{useCase.title}</h3>
          <p className="text-sm text-foreground/80 leading-snug">{useCase.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DemoVideoSection({ reducedMotion }: { reducedMotion: boolean | null }) {
  return (
    <section
      id="demo"
      className="relative py-16 md:py-24 px-4 bg-ink overflow-hidden border-y-4 border-border"
    >
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none text-white/10"
        viewBox="0 0 1440 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <path
          d="M-80 420 Q360 180 720 320 T1520 260"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M-120 520 Q420 380 840 460 T1560 380"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle cx="180" cy="120" r="140" fill="currentColor" opacity="0.04" />
        <circle cx="1280" cy="480" r="200" fill="currentColor" opacity="0.05" />
      </svg>

      <motion.div
        className="relative max-w-4xl mx-auto text-center"
        {...scrollFade(reducedMotion, { y: 24 })}
      >
        <span className="text-sm font-heading uppercase tracking-[0.2em] text-white/60">
          See it in action
        </span>
        <h2 className="mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-heading text-white leading-tight overflow-wrap-anywhere min-w-0">
          Watch a hunt unfold
        </h2>
        <p className="mt-3 text-base md:text-lg text-white/70 max-w-lg mx-auto">
          From first clue to onchain reward — under two minutes.
        </p>
        <div className="mt-6 rounded-base border-4 border-white/20 shadow-shadow overflow-hidden bg-black/40 aspect-video max-w-xl mx-auto">
          <iframe
            src={DEMO_VIDEO_URL}
            title="Khoj demo video"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </motion.div>
    </section>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const pageRef = useRef<HTMLDivElement>(null);
  const HeroMock = HERO_MOCK;

  const { scrollYProgress } = useScroll({
    target: pageRef,
    offset: ['start start', 'end end'],
  });

  const trailScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const scrollCompassRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const reverseCompassSpin = useMotionValue(0);
  const compassRotate = useTransform(
    [scrollCompassRotate, reverseCompassSpin],
    ([scroll, reverse]) => (scroll as number) + (reverse as number),
  );
  const lastScrollRef = useRef({ y: 0, time: Date.now() });

  useEffect(() => {
    if (reducedMotion) return;

    const onScroll = () => {
      const now = Date.now();
      const y = window.scrollY;
      const { y: lastY, time: lastTime } = lastScrollRef.current;
      const deltaY = y - lastY;
      const deltaTime = now - lastTime;

      if (deltaY < -10 && deltaTime < 120) {
        reverseCompassSpin.set(reverseCompassSpin.get() - 72);
      }

      lastScrollRef.current = { y, time: now };
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reducedMotion, reverseCompassSpin]);

  const launchApp = () => {
    markNavigatingFromLanding();
    navigate('/hunts');
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeUp = (delay = 0, y = 20) =>
    scrollFade(reducedMotion, { delay, y });

  const teamStep = JOURNEY_STEPS.find((s) => s.id === 'team')!;
  const leaderboardStep = JOURNEY_STEPS.find((s) => s.id === 'leaderboard')!;
  const rewardStep = JOURNEY_STEPS.find((s) => s.id === 'reward')!;

  return (
    <div ref={pageRef} className="min-h-screen bg-background overflow-x-clip">
      <LandingNav
        onLaunch={launchApp}
        links={[
          { id: 'hero', label: 'Start' },
          { id: 'journey', label: 'How it works' },
          { id: 'use-cases', label: 'Use cases' },
        ]}
        onScrollTo={scrollTo}
      />

      <div className="fixed left-3 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-2">
        <motion.div
          style={{ rotate: reducedMotion ? 0 : compassRotate }}
          className="text-chart-3"
          aria-hidden
        >
          <Compass className="w-5 h-5" strokeWidth={2.5} />
        </motion.div>
        <div className="w-1 h-24 bg-border/20 rounded-full overflow-hidden">
          <motion.div
            className="w-full bg-chart-3 origin-top"
            style={{ scaleY: trailScale, height: '100%' }}
          />
        </div>
        <span className="text-[10px] font-heading uppercase tracking-widest text-foreground/40 [writing-mode:vertical-rl] rotate-180">
          Trail
        </span>
      </div>

      <section
        id="hero"
        className="relative min-h-[100svh] bg-chart-2 overflow-visible pb-10 md:pb-14"
      >
        <div className="max-w-xl mx-auto px-4 pt-24 flex flex-col items-center gap-8 md:gap-10 min-h-[100svh]">
          <motion.div
            className="text-center z-10 w-full"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.65 }}
          >
            <KhojLogo size="lg" className="mx-auto mb-6" />
            <h1 className="text-[clamp(2rem,6vw,3.5rem)] font-heading text-white leading-[1.05] overflow-wrap-anywhere min-w-0">
              Your city is hiding something.
            </h1>
            <p className="mt-4 text-lg text-white/85 max-w-md mx-auto">
              {/* Geo and image treasure hunts — riddles, teams, onchain rewards. Pick a hunt and go. */}
              Geo-location based treasure hunts - solve clues, visit physical locations & earn rewards.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button size="lg" variant="neutral" onClick={launchApp}>
                Start Exploring
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="text-white hover:bg-white/10 border-2 border-white/30"
                onClick={() => scrollTo('journey')}
              >
                See how it works
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="flex justify-center w-full mt-auto"
            initial={{ opacity: 0, y: reducedMotion ? 0 : 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0.15 : 0.7, delay: reducedMotion ? 0 : 0.12 }}
          >
            <PhoneFrame>
              <HeroMock interactive={false} />
            </PhoneFrame>
          </motion.div>
        </div>
      </section>

      <DemoVideoSection reducedMotion={reducedMotion} />

      <div id="journey">
        <JourneySection
          step={teamStep}
          Mock={JOURNEY_MOCKS.team}
          reducedMotion={reducedMotion}
          stepIndex={0}
        />
        <ClueStepSection reducedMotion={reducedMotion} stepIndex={1} />
        <JourneySection
          step={leaderboardStep}
          Mock={JOURNEY_MOCKS.leaderboard}
          reducedMotion={reducedMotion}
          stepIndex={2}
        />
        <JourneySection
          step={rewardStep}
          Mock={JOURNEY_MOCKS.reward}
          reducedMotion={reducedMotion}
          stepIndex={3}
          confettiOnView
        />
      </div>

      <section
        id="use-cases"
        className="py-20 md:py-28 px-4 bg-secondary-background border-t-2 border-border"
      >
        <motion.div className="max-w-6xl mx-auto mb-10 text-center" {...fadeUp()}>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-heading text-ink overflow-wrap-anywhere min-w-0">
            Where Khoj shows up
          </h2>
          <p className="mt-3 text-lg text-foreground/70 max-w-xl mx-auto">
            Cities, events, brands — peel a sticker, start a hunt.
          </p>
        </motion.div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.slice(0, 6).map((useCase, index) => (
            <UseCaseCard
              key={useCase.title}
              useCase={useCase}
              index={index}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </section>

      <LandingCta onLaunch={launchApp} />
      <div className="bg-ink">
        <LandingFooter />
      </div>
    </div>
  );
}
