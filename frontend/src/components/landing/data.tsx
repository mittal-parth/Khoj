import {
  Building,
  Camera,
  Dumbbell,
  Gift,
  Rocket,
  Tent,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface UseCase {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  tiltClass: string;
}

export const MARQUEE_ITEMS = [
  'REAL PLACES',
  'REAL CLUES',
  'ONCHAIN REWARDS',
  'AI-PERSONALIZED',
  'TEAM PLAY',
  'GEO VERIFICATION',
] as const;

export const PROOF_STAMPS = [
  "ETHIndia '24 Finalist",
  'Polkadot Fast Grants',
  'Built on Base',
] as const;

export const USE_CASES: UseCase[] = [
  {
    title: 'Educational Hunts',
    description: 'Learn about museums and landmarks through exploration.',
    icon: <Building className="w-6 h-6" />,
    color: 'bg-chart-1',
    tiltClass: '-rotate-2',
  },
  {
    title: 'Co-branded Hunts',
    description: 'Promote products by routing clues through partner locations. Imagine Swiggy x Khoj!',
    icon: <Gift className="w-6 h-6" />,
    color: 'bg-chart-2',
    tiltClass: 'rotate-2',
  },
  {
    title: 'Airdrops',
    description: 'Distribute tokens through gamified participation.',
    icon: <Rocket className="w-6 h-6" />,
    color: 'bg-chart-3',
    tiltClass: '-rotate-1',
  },
  {
    title: 'Event Engagement',
    description: 'Enhance festivals and expos with interactive hunts.',
    icon: <Tent className="w-6 h-6" />,
    color: 'bg-chart-4',
    tiltClass: 'rotate-3',
  },
  {
    title: 'Fitness Incentives',
    description: 'Gamify physical activity with location-based rewards. Imagine running a marathon while going through designated clues.',
    icon: <Dumbbell className="w-6 h-6" />,
    color: 'bg-chart-5',
    tiltClass: '-rotate-2',
  },
  {
    title: 'Tourism Promotion',
    description: 'Drive interest in cultural and historical sites.',
    icon: <Camera className="w-6 h-6" />,
    color: 'bg-chart-1',
    tiltClass: 'rotate-1',
  },
  {
    title: 'Team Building',
    description: 'Foster collaboration through shared field missions.',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-chart-2',
    tiltClass: '-rotate-3',
  },
];

export const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'how-it-works', label: 'The Trail' },
  { id: 'use-cases', label: 'Use Cases' },
] as const;

export const FOOTER_LINKS = [
  { href: 'https://docs.playkhoj.com', label: 'Docs' },
  { href: 'https://github.com/mittal-parth/Khoj', label: 'GitHub' },
  { href: 'https://tinyurl.com/playkhoj', label: 'Deck' },
] as const;
