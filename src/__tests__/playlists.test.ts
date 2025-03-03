import { jest } from '@jest/globals';
import { PlaylistsHandler } from '../handlers/playlists.js';
import { SpotifyApi } from '../utils/api.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock the SpotifyApi class
jest.mock('../utils/api.js');

describe('PlaylistsHandler', () => {
  let playlistsHandler: PlaylistsHandler;
  let mockApi: jest.Mocked<SpotifyApi>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock instance of SpotifyApi
    mockApi = {
      makeRequest: jest.fn(),
      buildQueryString: jest.fn(),
    } as unknown as jest.Mocked<SpotifyApi>;

    playlistsHandler = new PlaylistsHandler(mockApi);
  });

  describe('getPlaylist', () => {
    it('should fetch a playlist by ID', async () => {
      const mockPlaylist = { id: '123', name: 'Test Playlist' };
      mockApi.makeRequest.mockResolvedValue(mockPlaylist);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getPlaylist({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123');
      expect(result).toEqual(mockPlaylist);
    });

    it('should fetch a playlist with market parameter', async () => {
      const mockPlaylist = { id: '123', name: 'Test Playlist' };
      mockApi.makeRequest.mockResolvedValue(mockPlaylist);
      mockApi.buildQueryString.mockReturnValue('?market=US');

      const result = await playlistsHandler.getPlaylist({ id: '123', market: 'US' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123?market=US');
      expect(result).toEqual(mockPlaylist);
    });

    it('should handle spotify:playlist: prefixed IDs', async () => {
      const mockPlaylist = { id: '123', name: 'Test Playlist' };
      mockApi.makeRequest.mockResolvedValue(mockPlaylist);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getPlaylist({ id: 'spotify:playlist:123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123');
      expect(result).toEqual(mockPlaylist);
    });
  });

  describe('getPlaylistTracks', () => {
    it('should fetch playlist tracks with default parameters', async () => {
      const mockTracks = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockTracks);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getPlaylistTracks({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123/tracks');
      expect(result).toEqual(mockTracks);
    });

    it('should fetch playlist tracks with custom parameters', async () => {
      const mockTracks = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockTracks);
      mockApi.buildQueryString.mockReturnValue('?market=US&limit=10&offset=20&fields=items(track(name))');

      const result = await playlistsHandler.getPlaylistTracks({
        id: '123',
        market: 'US',
        limit: 10,
        offset: 20,
        fields: 'items(track(name))'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123/tracks?market=US&limit=10&offset=20&fields=items(track(name))');
      expect(result).toEqual(mockTracks);
    });

    it('should handle spotify:playlist: prefixed IDs', async () => {
      const mockTracks = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockTracks);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getPlaylistTracks({
        id: 'spotify:playlist:123'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123/tracks');
      expect(result).toEqual(mockTracks);
    });
  });

  describe('getPlaylistItems', () => {
    it('should fetch playlist items with default parameters', async () => {
      const mockItems = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockItems);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getPlaylistItems({ id: '123' });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123/items');
      expect(result).toEqual(mockItems);
    });

    it('should fetch playlist items with custom parameters', async () => {
      const mockItems = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockItems);
      mockApi.buildQueryString.mockReturnValue('?market=US&limit=10&offset=20&fields=items(track(name))');

      const result = await playlistsHandler.getPlaylistItems({
        id: '123',
        market: 'US',
        limit: 10,
        offset: 20,
        fields: 'items(track(name))'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/playlists/123/items?market=US&limit=10&offset=20&fields=items(track(name))');
      expect(result).toEqual(mockItems);
    });
  });

  describe('modifyPlaylist', () => {
    it('should modify playlist with all parameters', async () => {
      const mockResponse = { id: '123', name: 'Updated Playlist' };
      mockApi.makeRequest.mockResolvedValue(mockResponse);

      const result = await playlistsHandler.modifyPlaylist({
        id: '123',
        name: 'Updated Playlist',
        public: true,
        collaborative: false,
        description: 'New description'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith(
        '/playlists/123',
        'PUT',
        {
          name: 'Updated Playlist',
          public: true,
          collaborative: false,
          description: 'New description'
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should modify playlist with partial parameters', async () => {
      const mockResponse = { id: '123', name: 'Updated Playlist' };
      mockApi.makeRequest.mockResolvedValue(mockResponse);

      const result = await playlistsHandler.modifyPlaylist({
        id: '123',
        name: 'Updated Playlist'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith(
        '/playlists/123',
        'PUT',
        {
          name: 'Updated Playlist'
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('addTracksToPlaylist', () => {
    it('should add tracks to playlist', async () => {
      const mockResponse = { snapshot_id: 'abc123' };
      mockApi.makeRequest.mockResolvedValue(mockResponse);

      const result = await playlistsHandler.addTracksToPlaylist({
        id: '123',
        uris: ['spotify:track:1', 'spotify:track:2']
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith(
        '/playlists/123/tracks',
        'POST',
        {
          uris: ['spotify:track:1', 'spotify:track:2']
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should add tracks to playlist at specific position', async () => {
      const mockResponse = { snapshot_id: 'abc123' };
      mockApi.makeRequest.mockResolvedValue(mockResponse);

      const result = await playlistsHandler.addTracksToPlaylist({
        id: '123',
        uris: ['spotify:track:1'],
        position: 5
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith(
        '/playlists/123/tracks',
        'POST',
        {
          uris: ['spotify:track:1'],
          position: 5
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('removeTracksFromPlaylist', () => {
    it('should remove tracks from playlist', async () => {
      const mockResponse = { snapshot_id: 'abc123' };
      mockApi.makeRequest.mockResolvedValue(mockResponse);

      const result = await playlistsHandler.removeTracksFromPlaylist({
        id: '123',
        tracks: [{ uri: 'spotify:track:1' }, { uri: 'spotify:track:2' }]
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith(
        '/playlists/123/tracks',
        'DELETE',
        {
          tracks: [{ uri: 'spotify:track:1' }, { uri: 'spotify:track:2' }]
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should remove tracks from playlist with snapshot_id', async () => {
      const mockResponse = { snapshot_id: 'abc123' };
      mockApi.makeRequest.mockResolvedValue(mockResponse);

      const result = await playlistsHandler.removeTracksFromPlaylist({
        id: '123',
        tracks: [{ uri: 'spotify:track:1' }],
        snapshot_id: 'abc123'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith(
        '/playlists/123/tracks',
        'DELETE',
        {
          tracks: [{ uri: 'spotify:track:1' }],
          snapshot_id: 'abc123'
        }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getCurrentUserPlaylists', () => {
    it('should fetch current user playlists with default parameters', async () => {
      const mockPlaylists = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockPlaylists);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getCurrentUserPlaylists({});

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/me/playlists');
      expect(result).toEqual(mockPlaylists);
    });

    it('should fetch current user playlists with custom parameters', async () => {
      const mockPlaylists = { items: [{ id: '1' }, { id: '2' }] };
      mockApi.makeRequest.mockResolvedValue(mockPlaylists);
      mockApi.buildQueryString.mockReturnValue('?limit=10&offset=20');

      const result = await playlistsHandler.getCurrentUserPlaylists({
        limit: 10,
        offset: 20
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/me/playlists?limit=10&offset=20');
      expect(result).toEqual(mockPlaylists);
    });
  });

  describe('getFeaturedPlaylists', () => {
    it('should fetch featured playlists with default parameters', async () => {
      const mockPlaylists = { playlists: { items: [{ id: '1' }, { id: '2' }] } };
      mockApi.makeRequest.mockResolvedValue(mockPlaylists);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getFeaturedPlaylists({});

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/browse/featured-playlists');
      expect(result).toEqual(mockPlaylists);
    });

    it('should fetch featured playlists with custom parameters', async () => {
      const mockPlaylists = { playlists: { items: [{ id: '1' }, { id: '2' }] } };
      mockApi.makeRequest.mockResolvedValue(mockPlaylists);
      mockApi.buildQueryString.mockReturnValue('?locale=es_ES&limit=10&offset=20');

      const result = await playlistsHandler.getFeaturedPlaylists({
        locale: 'es_ES',
        limit: 10,
        offset: 20
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/browse/featured-playlists?locale=es_ES&limit=10&offset=20');
      expect(result).toEqual(mockPlaylists);
    });
  });

  describe('getCategoryPlaylists', () => {
    it('should fetch category playlists with default parameters', async () => {
      const mockPlaylists = { playlists: { items: [{ id: '1' }, { id: '2' }] } };
      mockApi.makeRequest.mockResolvedValue(mockPlaylists);
      mockApi.buildQueryString.mockReturnValue('');

      const result = await playlistsHandler.getCategoryPlaylists({
        category_id: 'pop'
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/browse/categories/pop/playlists');
      expect(result).toEqual(mockPlaylists);
    });

    it('should fetch category playlists with custom parameters', async () => {
      const mockPlaylists = { playlists: { items: [{ id: '1' }, { id: '2' }] } };
      mockApi.makeRequest.mockResolvedValue(mockPlaylists);
      mockApi.buildQueryString.mockReturnValue('?limit=10&offset=20');

      const result = await playlistsHandler.getCategoryPlaylists({
        category_id: 'pop',
        limit: 10,
        offset: 20
      });

      expect(mockApi.makeRequest).toHaveBeenCalledWith('/browse/categories/pop/playlists?limit=10&offset=20');
      expect(result).toEqual(mockPlaylists);
    });
  });
}); 