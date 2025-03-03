import { jest } from '@jest/globals';
import { ArtistsHandler } from '../handlers/artists.js';
import { SpotifyApi } from '../utils/api.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock the SpotifyApi class
jest.mock('../utils/api.js');

describe('ArtistsHandler', () => {
  let artistsHandler: ArtistsHandler;
  let mockApi: jest.Mocked<SpotifyApi>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock instance of SpotifyApi
    mockApi = {
      makeRequest: jest.fn(),
      buildQueryString: jest.fn(),
    } as unknown as jest.Mocked<SpotifyApi>;

    artistsHandler = new ArtistsHandler(mockApi);
  });

  describe('getArtist', () => {
    it('should fetch an artist by ID', async () => {
      const mockArtist = { id: '123', name: 'Test Artist' };
      mockApi.makeRequest.mockResolvedValue(mockArtist);

      const result = await artistsHandler.getArtist({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123');
      expect(result).toEqual(mockArtist);
    });

    it('should handle spotify:artist: prefixed IDs', async () => {
      const mockArtist = { id: '123', name: 'Test Artist' };
      mockApi.makeRequest.mockResolvedValue(mockArtist);

      const result = await artistsHandler.getArtist({ id: 'spotify:artist:123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123');
      expect(result).toEqual(mockArtist);
    });
  });

  describe('getMultipleArtists', () => {
    it('should fetch multiple artists by IDs', async () => {
      const mockArtists = { artists: [{ id: '123' }, { id: '456' }] };
      mockApi.makeRequest.mockResolvedValue(mockArtists);

      const result = await artistsHandler.getMultipleArtists({ ids: ['123', '456'] });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists?ids=123,456');
      expect(result).toEqual(mockArtists);
    });

    it('should throw error when no IDs are provided', async () => {
      await expect(
        artistsHandler.getMultipleArtists({ ids: [] })
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'At least one artist ID must be provided'));
    });

    it('should throw error when more than 50 IDs are provided', async () => {
      const ids = Array(51).fill('123');
      await expect(
        artistsHandler.getMultipleArtists({ ids })
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'Maximum of 50 artist IDs allowed'));
    });

    it('should handle spotify:artist: prefixed IDs', async () => {
      const mockArtists = { artists: [{ id: '123' }, { id: '456' }] };
      mockApi.makeRequest.mockResolvedValue(mockArtists);

      const result = await artistsHandler.getMultipleArtists({
        ids: ['spotify:artist:123', 'spotify:artist:456']
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists?ids=123,456');
      expect(result).toEqual(mockArtists);
    });
  });

  describe('getArtistTopTracks', () => {
    it('should fetch artist top tracks', async () => {
      const mockTracks = { tracks: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockTracks);

      const result = await artistsHandler.getArtistTopTracks({
        id: '123',
        market: 'US'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/top-tracks?market=US');
      expect(result).toEqual(mockTracks);
    });

    it('should throw error when market is not provided', async () => {
      await expect(
        artistsHandler.getArtistTopTracks({ id: '123' })
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'market parameter is required for top tracks'));
    });

    it('should handle spotify:artist: prefixed IDs', async () => {
      const mockTracks = { tracks: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockTracks);

      const result = await artistsHandler.getArtistTopTracks({
        id: 'spotify:artist:123',
        market: 'US'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/top-tracks?market=US');
      expect(result).toEqual(mockTracks);
    });
  });

  describe('getArtistRelatedArtists', () => {
    it('should fetch related artists', async () => {
      const mockArtists = { artists: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockArtists);

      const result = await artistsHandler.getArtistRelatedArtists({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/related-artists');
      expect(result).toEqual(mockArtists);
    });

    it('should handle spotify:artist: prefixed IDs', async () => {
      const mockArtists = { artists: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockArtists);

      const result = await artistsHandler.getArtistRelatedArtists({
        id: 'spotify:artist:123'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/related-artists');
      expect(result).toEqual(mockArtists);
    });
  });

  describe('getArtistAlbums', () => {
    it('should fetch artist albums with default parameters', async () => {
      const mockAlbums = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockAlbums);
      mockApi.buildQueryString.mockReturnValue('?limit=20&offset=0');

      const result = await artistsHandler.getArtistAlbums({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/albums?limit=20&offset=0');
      expect(result).toEqual(mockAlbums);
    });

    it('should fetch artist albums with custom parameters', async () => {
      const mockAlbums = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockAlbums);
      mockApi.buildQueryString.mockReturnValue('?limit=10&offset=20&include_groups=album,single');

      const result = await artistsHandler.getArtistAlbums({
        id: '123',
        limit: 10,
        offset: 20,
        include_groups: ['album', 'single']
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/albums?limit=10&offset=20&include_groups=album,single');
      expect(result).toEqual(mockAlbums);
    });

    it('should throw error when limit is out of range', async () => {
      await expect(
        artistsHandler.getArtistAlbums({ id: '123', limit: 51 })
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'Limit must be between 1 and 50'));
    });

    it('should throw error when offset is negative', async () => {
      await expect(
        artistsHandler.getArtistAlbums({ id: '123', offset: -1 })
      ).rejects.toThrow(new McpError(ErrorCode.InvalidParams, 'Offset must be non-negative'));
    });

    it('should handle spotify:artist: prefixed IDs', async () => {
      const mockAlbums = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockAlbums);
      mockApi.buildQueryString.mockReturnValue('?limit=20&offset=0');

      const result = await artistsHandler.getArtistAlbums({
        id: 'spotify:artist:123'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/artists/123/albums?limit=20&offset=0');
      expect(result).toEqual(mockAlbums);
    });
  });
}); 