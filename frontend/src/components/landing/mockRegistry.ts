import {
  HuntsListHeroMock,
  TeamMock,
  ClueGeoMock,
  ImageCaptureMock,
  LeaderboardMock,
  RewardMock,
} from './AppMocks';

export const JOURNEY_MOCKS = {
  team: TeamMock,
  clue: ClueGeoMock,
  'image-hunt': ImageCaptureMock,
  leaderboard: LeaderboardMock,
  reward: RewardMock,
} as const;

export const HERO_MOCK = HuntsListHeroMock;

export const ClueGeo = ClueGeoMock;
export const ClueImage = ImageCaptureMock;
