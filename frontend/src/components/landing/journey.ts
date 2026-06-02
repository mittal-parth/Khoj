import type { ReactNode } from 'react';

export type JourneyStepId = 'team' | 'leaderboard' | 'reward';

export interface JourneyStep {
  id: JourneyStepId;
  number: number;
  kicker: string;
  title: string;
  blurb: string;
  bgClass: string;
  textClass: string;
}

export const CLUE_SECTION_STYLE = {
  bgClass: 'bg-ink',
  textClass: 'text-white',
} as const;

export const CLUE_STEP = {
  kicker: 'Step 02',
  title: 'Crack the clue',
  blurb:
    'Thematic riddles point you to real locations. Visit the location and verify your coordinates or snap an image to unlock the next clue.',
} as const;

export const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'team',
    number: 1,
    kicker: 'Step 01',
    title: 'Find a hunt, join a team',
    blurb:
      'Register for a hunt near you. Pick a team or go solo.',
    bgClass: 'bg-chart-5',
    textClass: 'text-white',
  },
  {
    id: 'leaderboard',
    number: 3,
    kicker: 'Step 03',
    title: 'Climb the leaderboard',
    blurb:
      'Get 6 attempts per clue. Faster solves with fewer attempts rank higher.',
    bgClass: 'bg-chart-3',
    textClass: 'text-white',
  },
  {
    id: 'reward',
    number: 4,
    kicker: 'Step 04',
    title: 'Claim the treasure',
    blurb:
      'Find all clues, and claim rewards from organizers.',
    bgClass: 'bg-main',
    textClass: 'text-main-foreground',
  },
];

export const PROOF_STAMPS = [
  { label: "ETHIndia '24 Finalist", icon: 'trophy' as const },
  { label: 'Polkadot Fast Grants', icon: 'award' as const },
  { label: 'Open Source', icon: 'github' as const },
] as const;

export const ABOUT_COPY = {
  title: 'Why Khoj',
  body: 'Khoj (meaning "search" or "discovery" in Hindi) is a geo-location treasure hunt platform that combines real-world exploration with Web3. Solve riddles, visit physical locations, and earn onchain rewards — with a Web2-native experience that skips the seed-phrase friction.',
} as const;

export const FOOTER_LINKS = [
  { href: 'https://docs.playkhoj.com', label: 'Docs' },
  { href: 'https://github.com/mittal-parth/Khoj', label: 'GitHub' },
  { href: 'https://tinyurl.com/playkhoj', label: 'Deck' },
] as const;

export const DEMO_VIDEO_URL = 'https://www.youtube.com/embed/98OJuvBur6s';

export type MockActionHandler = () => void;

export interface MockProps {
  onAction?: MockActionHandler;
  actionLabel?: string;
  interactive?: boolean;
}

export type JourneyMockRenderer = (props: MockProps) => ReactNode;
