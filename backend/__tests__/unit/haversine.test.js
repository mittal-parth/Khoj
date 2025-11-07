import { describe, it, expect } from '@jest/globals';
import haversineDistance from '../../haversine-distance.js';

describe('Haversine Distance Calculation', () => {
  it('should calculate distance between two coordinates correctly', () => {
    // New York to Los Angeles (approximately 3936 km)
    const lat1 = 40.7128;
    const lon1 = -74.0060;
    const lat2 = 34.0522;
    const lon2 = -118.2437;

    const distance = haversineDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    
    // Should be approximately 3936 km (3,936,000 meters)
    expect(distance).toBeGreaterThan(3900000);
    expect(distance).toBeLessThan(4000000);
  });

  it('should return 0 for same coordinates', () => {
    const lat = 40.7128;
    const lon = -74.0060;

    const distance = haversineDistance({ lat, lng: lon }, { lat, lng: lon });
    
    expect(distance).toBe(0);
  });

  it('should calculate short distances accurately', () => {
    // Two points very close together (approximately 1 km apart)
    const lat1 = 40.7128;
    const lon1 = -74.0060;
    const lat2 = 40.7228; // About 1.1 km north
    const lon2 = -74.0060;

    const distance = haversineDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    
    // Should be approximately 1100 meters
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1200);
  });

  it('should handle negative coordinates', () => {
    // Sydney to Buenos Aires
    const lat1 = -33.8688;
    const lon1 = 151.2093;
    const lat2 = -34.6037;
    const lon2 = -58.3816;

    const distance = haversineDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    
    // Should be a large distance (over 10,000 km)
    expect(distance).toBeGreaterThan(10000000);
  });

  it('should handle equator crossing', () => {
    const lat1 = 10;
    const lon1 = 0;
    const lat2 = -10;
    const lon2 = 0;

    const distance = haversineDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    
    // Should be approximately 2222 km
    expect(distance).toBeGreaterThan(2200000);
    expect(distance).toBeLessThan(2250000);
  });

  it('should handle prime meridian crossing', () => {
    const lat1 = 0;
    const lon1 = 10;
    const lat2 = 0;
    const lon2 = -10;

    const distance = haversineDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    
    // Should be approximately 2222 km
    expect(distance).toBeGreaterThan(2200000);
    expect(distance).toBeLessThan(2250000);
  });

  it('should handle antipodal points', () => {
    // Points on opposite sides of Earth
    const lat1 = 0;
    const lon1 = 0;
    const lat2 = 0;
    const lon2 = 180;

    const distance = haversineDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
    
    // Should be approximately half Earth's circumference (20,000 km)
    expect(distance).toBeGreaterThan(19000000);
    expect(distance).toBeLessThan(21000000);
  });
});
