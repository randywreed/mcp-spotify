import { jest } from '@jest/globals';
import { TracksHandler } from '../handlers/tracks.js';
import { SpotifyApi } from '../utils/api.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock the SpotifyApi class
jest.mock('../utils/api.js');

describe('TracksHandler', () => {
  let tracksHandler: TracksHandler;
  let mockApi: jest.Mocked<SpotifyApi>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock instance of SpotifyApi
    mockApi = {
      makeRequest: jest.fn(),
      buildQueryString: jest.fn(),
    } as unknown as jest.Mocked<SpotifyApi>;

    tracksHandler = new TracksHandler(mockApi);
  });

  describe('getTrack', () => {
    it('should fetch a track by ID', async () => {
      const mockTrack = { id: '123', name: 'Test Track' };
      mockApi.makeRequest.mockResolvedValue(mockTrack);

      const result = await tracksHandler.getTrack({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/tracks/123');
      expect(result).toEqual(mockTrack);
    });

    it('should handle spotify:track: prefixed IDs', async () => {
      const mockTrack = { id: '123', name: 'Test Track' };
      mockApi.makeRequest.mockResolvedValue(mockTrack);

      const result = await tracksHandler.getTrack({ id: 'spotify:track:123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/tracks/123');
      expect(result).toEqual(mockTrack);
    });
  });

  describe('getRecommendations', () => {
    it('should fetch recommendations with valid parameters', async () => {
      const mockRecommendations = { tracks: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockRecommendations);
      mockApi.buildQueryString.mockReturnValue('?seed_tracks=123&limit=20');

      const result = await tracksHandler.getRecommendations({
        seed_tracks: ['123'],
        limit: 20,
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/recommendations?seed_tracks=123&limit=20');
      expect(result).toEqual(mockRecommendations);
    });

    it('should throw error when no seeds are provided', async () => {
      await expect(
        tracksHandler.getRecommendations({})
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'At least one seed (tracks, artists, or genres) must be provided'));
    });

    it('should throw error when limit is out of range', async () => {
      await expect(
        tracksHandler.getRecommendations({ seed_tracks: ['123'], limit: 101 })
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'Limit must be between 1 and 100'));
    });

    it('should handle spotify:artist: prefixed IDs', async () => {
      const mockRecommendations = { tracks: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockRecommendations);
      mockApi.buildQueryString.mockReturnValue('?seed_artists=456&limit=20');

      const result = await tracksHandler.getRecommendations({
        seed_artists: ['spotify:artist:456'],
        limit: 20,
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/recommendations?seed_artists=456&limit=20');
      expect(result).toEqual(mockRecommendations);
    });

    it('should handle multiple seed types', async () => {
      const mockRecommendations = { tracks: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockRecommendations);
      mockApi.buildQueryString.mockReturnValue('?seed_tracks=123&seed_artists=456&seed_genres=rock&limit=20');

      const result = await tracksHandler.getRecommendations({
        seed_tracks: ['123'],
        seed_artists: ['456'],
        seed_genres: ['rock'],
        limit: 20,
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/recommendations?seed_tracks=123&seed_artists=456&seed_genres=rock&limit=20');
      expect(result).toEqual(mockRecommendations);
    });
  });

  describe('getAvailableGenres', () => {
    it('should fetch available genres', async () => {
      const mockGenres = { genres: ['rock', 'pop', 'jazz'] };
      mockApi.makeRequest.mockResolvedValue(mockGenres);

      const result = await tracksHandler.getAvailableGenres();

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/recommendations/available-genre-seeds');
      expect(result).toEqual(mockGenres);
    });
  });
}); 