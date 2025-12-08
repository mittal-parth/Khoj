import { jest } from '@jest/globals';

// Set test environment variables
// Environment variables are now set via GitHub secrets in CI/CD
// For local testing, create a .env file in the backend directory
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '8001';
process.env.HOST = process.env.HOST || 'http://localhost:8001';
process.env.MAX_DISTANCE_IN_METERS = process.env.MAX_DISTANCE_IN_METERS || '60';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to create mock request data
  createMockEncryptRequest: () => ({
    userAddress: '0x0000000000000000000000000000000000000000',
    clues: [
      { id: 1, description: 'Test clue 1', location: 'Location 1' },
      { id: 2, description: 'Test clue 2', location: 'Location 2' }
    ],
    answers: [
      { id: 1, answer: 'Answer 1', lat: 40.7128, long: -74.0060 },
      { id: 2, answer: 'Answer 2', lat: 34.0522, long: -118.2437 }
    ]
  }),

  // Helper to create mock location data
  createMockLocation: (lat = 40.7128, long = -74.0060) => ({
    cLat: lat,
    cLong: long
  }),

  // Helper to create mock riddle generation request
  createMockRiddleRequest: () => ({
    locations: [
      { name: 'Central Park', lat: 40.785091, lng: -73.968285 },
      { name: 'Times Square', lat: 40.758896, lng: -73.985130 }
    ],
    theme: 'mystery'
  })
};
