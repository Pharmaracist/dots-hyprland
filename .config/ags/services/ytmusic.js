import Service from 'resource:///com/github/Aylur/ags/service.js';
import GLib from 'gi://GLib';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Gio from 'gi://Gio';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import YTMusicAPI from './ytmusic_api.js';

// Audio quality formats
const AUDIO_FORMATS = {
    'low': 'worstaudio/bestaudio[abr<=64]',
    'medium': 'bestaudio[abr<=128]/bestaudio',
    'high': 'bestaudio[acodec=opus]/bestaudio',
    'best': 'bestaudio'
};

// Default options
const DEFAULT_OPTIONS = {
    audioQuality: 'medium',
    queueSize: 1,
    cacheTimeout: 90,
    cacheDir: GLib.build_filenamev([GLib.get_user_cache_dir(), 'ytmusic']),
    maxCacheSize: 10240 * 10240 * 10240, // 1GB
};

class YouTubeMusicService extends Service {
    static {
        Service.register(this, {
            'current-track': ['jsobject'],
            'playing': ['boolean'],
            'position': ['float'],
            'duration': ['float'],
            'volume': ['float'],
            'repeat': ['boolean'],
            'shuffle': ['boolean'],
            'search-results': ['jsobject'],
            'loading': ['boolean'],
            'caching-status': ['jsobject'],
            'show-downloaded': ['boolean'],
            'downloaded-tracks': ['jsobject'],
        }, {
            'current-track': ['jsobject', 'rw'],
            'playing': ['boolean', 'rw'],
            'position': ['float', 'rw'],
            'duration': ['float', 'rw'],
            'volume': ['float', 'rw'],
            'repeat': ['boolean', 'rw'],
            'shuffle': ['boolean', 'rw'],
            'search-results': ['jsobject', 'rw'],
            'loading': ['boolean', 'rw'],
            'caching-status': ['jsobject', 'rw'],
            'show-downloaded': ['boolean', 'rw'],
            'downloaded-tracks': ['jsobject', 'rw'],
        });
    }

    _searchResults = [];
    _currentTrack = null;
    _volume = 1.0;
    _playing = false;
    _repeat = false;
    _shuffle = false;
    _position = 0;
    _duration = 0;
    _loading = false;
    _cachingStatus = new Map();
    _showDownloaded = false;
    _downloadedTracks = [];
    _mprisPlayer = null;
    _options = { ...DEFAULT_OPTIONS };
    _audioUrlCache = new Map();
    _trackInfoCache = new Map();
    _cacheTimeout = 30 * 60 * 1000;
    _currentVideoId = null;
    _playlist = [];
    _currentIndex = -1;
    _stateFile = GLib.build_filenamev([App.configDir, 'state', 'ytmusic-state.json']);
    _updateInterval = null;
    _lastOnlineResults = [];
    _currentSearchQuery = '';
    _lastDownloadedResults = [];
    _defaultContent = [];
    _cache = new Map();

    constructor() {
        super();
        
        // Initialize with default values
        this._currentTrack = null;
        this._volume = 1.0;
        this._playing = false;
        this._repeat = false;
        this._shuffle = false;
        this._currentVideoId = null;
        this._playlist = [];
        this._metadataFile = '/tmp/ytmusic-metadata.json';
        this._position = 0;
        this._duration = 0;
        
        // Initialize options first
        this._initOptions();
        
        // Ensure cache directory exists
        const cacheDir = this._getOption('cacheDir');
        if (!GLib.file_test(cacheDir, GLib.FileTest.EXISTS)) {
            GLib.mkdir_with_parents(cacheDir, 0o755);
        }
        
        // Load saved state - this will override the default values
        this._loadState();

        // Connect to MPRIS
        this._initMpris();
        
        // Set up state change listeners
        this.connect('notify::current-track', () => this._saveState());
        this.connect('notify::volume', () => this._saveState());
        this.connect('notify::playing', () => this._saveState());
        this.connect('notify::repeat', () => this._saveState());
        this.connect('notify::shuffle', () => this._saveState());
        this.connect('notify::position', () => this._saveState());
        this.connect('notify::duration', () => this._saveState());
        this.connect('notify::loading', () => this._saveState());

        // Set up periodic state saving
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30 * 1000, () => {
            this._saveState();
            return GLib.SOURCE_CONTINUE;
        });

        // Set up periodic cache cleanup
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5 * 60 * 1000, () => {
            this._cleanupCache();
            return GLib.SOURCE_CONTINUE;
        });

        // Set up periodic position update
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this._updatePlayingState();
            return GLib.SOURCE_CONTINUE;
        });

        this._initDownloadedTracks();
        this._initDefaultContent();
    }

    _initOptions() {
        // Initialize with defaults
        this._options = { ...DEFAULT_OPTIONS };
        
        // Try to load options from config file
        try {
            const configFile = GLib.build_filenamev([App.configDir, 'ytmusic-config.json']);
            if (GLib.file_test(configFile, GLib.FileTest.EXISTS)) {
                const [ok, contents] = GLib.file_get_contents(configFile);
                if (ok) {
                    const savedOptions = JSON.parse(new TextDecoder().decode(contents));
                    this._options = { ...DEFAULT_OPTIONS, ...savedOptions };
                }
            }
        } catch (error) {
            // Removed console logging
        }
    }

    _getOption(key) {
        return this._options[key];
    }

    // Property getters and setters
    get searchResults() { return this._searchResults; }
    set searchResults(value) {
        this._searchResults = value;
        this.notify('search-results');
    }

    get currentTrack() { return this._currentTrack; }
    set currentTrack(value) {
        this._currentTrack = value;
        this.notify('current-track');
    }

    get playing() { return this._playing; }
    set playing(value) {
        this._playing = value;
        this.notify('playing');
    }

    get repeat() { return this._repeat; }
    set repeat(value) {
        this._repeat = value;
        this.notify('repeat');
    }

    get shuffle() { return this._shuffle; }
    set shuffle(value) {
        this._shuffle = value;
        this.notify('shuffle');
    }

    get volume() { return this._volume; }
    set volume(value) {
        this._volume = value;
        this.notify('volume');
    }

    get position() { return this._position; }
    set position(value) {
        this._position = value;
        this.notify('position');
    }

    get duration() { return this._duration; }
    set duration(value) {
        this._duration = value;
        this.notify('duration');
    }

    get loading() { return this._loading; }
    set loading(value) {
        this._loading = value;
        this.notify('loading');
    }

    get cachingStatus() { return Object.fromEntries(this._cachingStatus); }

    get showDownloaded() { return this._showDownloaded; }

    get downloadedTracks() {
        return this._downloadedTracks.map(track => ({
            ...track,
            isDownloaded: true,
        }));
    }

    // Playback controls
    async _isOnline() {
        try {
            const result = await Utils.execAsync(['ping', '-c', '1', '-W', '1', '8.8.8.8']);
            return result !== null;
        } catch (e) {
            return false;
        }
    }

    async play(videoId = null) {
        try {
            if (!videoId && !this._currentVideoId) return;
            
            if (videoId) {
                this._currentVideoId = videoId;
                
                // Get track info first
                const trackInfo = await this._getTrackInfo(videoId);
                if (trackInfo) {
                    this._currentTrack = {
                        videoId,
                        title: trackInfo.title,
                        artists: trackInfo.artists,
                        thumbnail: trackInfo.thumbnail,
                        duration: trackInfo.duration
                    };
                    this.notify('current-track');
                }

                // Get audio URL
                const audioUrl = await this._getAudioUrl(videoId);
                if (!audioUrl) {
                    throw new Error('Failed to get audio URL');
                }

                // Start playback with mpv
                await Utils.execAsync([
                    'mpv',
                    '--no-video',
                    '--no-terminal',
                    '--force-window=no',
                    '--ytdl=no',
                    '--no-resume-playback',
                    '--audio-display=no',
                    audioUrl
                ]);

                this._playing = true;
                this.notify('playing');

                // Set metadata for MPRIS
                if (this._currentTrack) {
                    const metadata = {
                        'xesam:title': this._currentTrack.title,
                        'xesam:artist': [this._currentTrack.artists[0].name],
                        'mpris:artUrl': this._currentTrack.thumbnail,
                        'mpris:trackid': `/org/mpris/MediaPlayer2/Track/${videoId}`,
                        'mpris:length': this._duration * 1000000
                    };
                    
                    // Update MPRIS metadata
                    if (this._mprisPlayer) {
                        this._mprisPlayer.metadata = metadata;
                    }
                }
            } else {
                // Resume playback
                await this._setMpvProperty('pause', false);
                this._playing = true;
                this.notify('playing');
            }
        } catch (e) {
            logError('Error playing track:', e);
            this._playing = false;
            this.notify('playing');
        }
    }

    async stop() {
        try {
            await Utils.execAsync(['killall', '-9', 'mpv']).catch(() => {});
            this._currentTrack = null;
            this._currentVideoId = null;
            this._playing = false;
            this._mprisPlayer = null;
            this.notify('current-track');
            this.notify('playing');
        } catch (error) {
            // Removed console logging
            this._cleanup();
        }
    }

    async togglePlay() {
        if (this._playing) {
            await this.pause();
        } else {
            await this.play();
        }
    }

    _cleanup() {
        this._currentTrack = null;
        this._currentVideoId = null;
        this._playing = false;
        this._mprisPlayer = null;
        this.notify('current-track');
        this.notify('playing');
    }

    async _queueSimilarTracks() {
        if (!this._currentVideoId) return;

        try {
            // Get recommendations from ytmusic_helper.py
            const result = await YTMusicAPI.getRadio(this._currentVideoId);

            const tracks = result;
            for (const track of tracks) {
                if (!this._queuedTracks.has(track.videoId)) {
                    this.addToPlaylist(track);
                    this._queuedTracks.add(track.videoId);
                }
            }
        } catch (error) {
            // Removed console logging
        }
    }

    _initMpris() {
        // Initial setup
        const players = Mpris.players;
        const ytPlayer = players.find(p => p.identity.toLowerCase().includes('youtube'));
        if (ytPlayer) {
            this._mprisPlayer = ytPlayer;
            this._setupMprisHandlers();
        }

        // Watch for changes
        Mpris.connect('changed', () => {
            const players = Mpris.players;
            const ytPlayer = players.find(p => p.identity.toLowerCase().includes('youtube'));
            
            if (ytPlayer !== this._mprisPlayer) {
                this._mprisPlayer = ytPlayer;
                if (ytPlayer) {
                    this._setupMprisHandlers();
                } else {
                    this._currentTrack = null;
                    this._playing = false;
                    this._position = 0;
                    this.notify('current-track');
                    this.notify('playing');
                    this.notify('position');
                }
            }
        });
    }

    _setupMprisHandlers() {
        if (!this._mprisPlayer) return;

        this._mprisPlayer.connect('notify::metadata', () => {
            const metadata = this._mprisPlayer.metadata;
            if (!metadata) return;

            try {
                const track = {
                    title: metadata['xesam:title']?.toString() || '',
                    artists: (metadata['xesam:artist'] || []).map(name => ({ name: name.toString() })),
                    album: metadata['xesam:album']?.toString() || '',
                    artUrl: metadata['mpris:artUrl']?.toString() || '',
                    length: parseInt(metadata['mpris:length']?.toString() || '0', 10),
                };
                
                if (JSON.stringify(this._currentTrack) !== JSON.stringify(track)) {
                    this._currentTrack = track;
                    this.notify('current-track');
                }
            } catch (e) {
                console.error('Error updating metadata:', e);
            }
        });

        this._mprisPlayer.connect('notify::playback-status', () => {
            const newStatus = this._mprisPlayer.playbackStatus === 'Playing';
            if (this._playing !== newStatus) {
                this._playing = newStatus;
                this.notify('playing');
            }
        });

        this._mprisPlayer.connect('notify::position', () => {
            const newPosition = this._mprisPlayer.position || 0;
            if (Math.abs(this._position - newPosition) > 1.0) {
                this._position = newPosition;
                this.notify('position');
            }
        });
    }

    async seek(position) {
        if (!this._mprisPlayer || !this._duration) return;

        try {
            // Clamp position between 0 and duration
            const clampedPosition = Math.max(0, Math.min(position, this._duration));
            
            // Convert to microseconds for MPRIS
            const positionUs = Math.floor(clampedPosition * 1000000);
            
            // Update position immediately for responsive UI
            this._position = clampedPosition;
            this.notify('position');

            // Send seek command to MPV
            await this._sendMpvCommand(['seek', clampedPosition, 'absolute']);
            
            // Verify seek succeeded
            const actualPosition = await this._getMpvProperty('time-pos');
            if (Math.abs(actualPosition - clampedPosition) > 1) {
                // Seek didn't work as expected, update UI with actual position
                this._position = actualPosition;
                this.notify('position');
            }
        } catch (e) {
            console.error('Error seeking:', e);
            // Revert to actual position on error
            const actualPosition = await this._getMpvProperty('time-pos').catch(() => 0);
            this._position = actualPosition;
            this.notify('position');
        }
    }

    async _getMpvProperty(property) {
        try {
            const result = await Utils.execAsync(['sh', '-c', `echo '{ "command": ["get_property", "${property}"] }' | socat - /tmp/mpvsocket`]);
            return JSON.parse(result).data;
        } catch (e) {
            return null;
        }
    }

    async _sendMpvCommand(command) {
        try {
            const cmdJson = JSON.stringify({ command });
            await Utils.execAsync(['sh', '-c', `echo '${cmdJson}' | socat - /tmp/mpvsocket`]);
            return true;
        } catch (e) {
            console.error('Error sending MPV command:', e);
            return false;
        }
    }

    async _updatePlayingState() {
        try {
            const [pause, position, duration, volume] = await Promise.all([
                this._getMpvProperty('pause'),
                this._getMpvProperty('time-pos'),
                this._getMpvProperty('duration'),
                this._getMpvProperty('volume')
            ]);

            // Update playing state based on MPV's pause property
            if (pause !== null) {
                this._playing = !pause;
                this.notify('playing');
            }

            // Update position and duration
            if (position !== null) {
                this._position = position;
                this.notify('position');
            }
            if (duration !== null) {
                this._duration = duration;
                this.notify('duration');
            }
            if (volume !== null) {
                this._volume = volume;
                this.notify('volume');
            }

            // Handle end of track
            if (position !== null && duration !== null && position >= duration - 0.5) {
                if (this._repeat) {
                    await this.seek(0);
                    if (!this._playing) {
                        await this._setMpvProperty('pause', false);
                    }
                } else {
                    await this.next();
                }
            }

            return GLib.SOURCE_CONTINUE;
        } catch (e) {
            logError('Error updating playing state:', e);
            // If we get an error, assume MPV has closed
            this._playing = false;
            this.notify('playing');
            if (this._updateInterval) {
                GLib.source_remove(this._updateInterval);
                this._updateInterval = null;
            }
            return GLib.SOURCE_REMOVE;
        }
    }

    async _updateTrackFromMpris() {
        if (!this._mprisPlayer) return;

        try {
            // Get metadata from MPRIS
            const metadata = this._mprisPlayer.metadata;
            if (!metadata) return;

            // Extract track info
            const title = metadata['xesam:title'] || '';
            const artist = metadata['xesam:artist']?.[0] || '';
            const artUrl = metadata['mpris:artUrl'] || '';
            const trackid = metadata['mpris:trackid'] || '';
            const videoId = trackid.split('/').pop() || this._currentVideoId;

            // Try to get thumbnail from cache if not in MPRIS
            let thumbnail = artUrl;
            if (!thumbnail && videoId) {
                const trackInfo = await this._getTrackInfo(videoId);
                if (trackInfo?.thumbnail) {
                    thumbnail = trackInfo.thumbnail;
                }
            }

            // Update current track
            const trackUpdate = {
                title,
                artists: [{ name: artist }],
                thumbnail,
                videoId,
            };

            // Always update thumbnail if it changes
            const thumbnailChanged = !this._currentTrack?.thumbnail && thumbnail;
            
            // Check for other changes
            const hasChanges = !this._currentTrack ||
                this._currentTrack.title !== trackUpdate.title ||
                this._currentTrack.artists[0].name !== trackUpdate.artists[0].name ||
                thumbnailChanged;

            if (hasChanges || thumbnailChanged) {
                this._currentTrack = trackUpdate;
                this.notify('current-track');

                // Show notification for track change
                if (hasChanges) {
                    this._showNotification(
                        'Now Playing',
                        `${title} - ${artist}`
                    );
                }
            }

            // Update position and duration
            const length = metadata['mpris:length'] || 0;
            if (length > 0) {
                this._duration = Math.floor(length / 1000000);
                this.notify('duration');
            }

            const position = this._mprisPlayer.position || 0;
            if (position > 0) {
                this._position = Math.floor(position / 1000000);
                this.notify('position');
            }
        } catch (e) {
            logError('Error updating track from MPRIS:', e);
        }
    }

    // Property getters and setters
    get playlist() { return this._playlist; }
    set playlist(value) {
        this._playlist = value;
        this.notify('playlist');
    }

    // Playlist management
    addToPlaylist(track) {
        this._playlist.push(track);
        if (this._currentIndex === -1) {
            this._currentIndex = 0;
        }
        this.notify('playlist');
    }

    clearPlaylist() {
        this._playlist = [];
        this._currentIndex = -1;
        this.notify('playlist');
    }

    async _performSearch(query) {
        try {
            const result = await YTMusicAPI.searchSongs(query);
            return result;
        } catch (error) {
            logError(error);
            return [];
        }
    }

    async search(query) {
        this._currentSearchQuery = query;

        if (!query) {
            // Show default content when no search query
            this._searchResults = this._showDownloaded ? 
                this._downloadedTracks : 
                (this._defaultContent.length > 0 ? this._defaultContent : this._lastOnlineResults);
            this.notify('search-results');
            
            // Refresh default content in the background
            if (!this._showDownloaded) {
                this._initDefaultContent().catch(logError);
            }
            return;
        }

        try {
            this._loading = true;
            this.notify('loading');

            let results;
            const lowerQuery = query.toLowerCase();

            if (this._showDownloaded) {
                // Optimize local search with pre-filtering
                results = this._downloadedTracks.filter(track => {
                    const titleMatch = track.title?.toLowerCase().includes(lowerQuery);
                    const artistMatch = track.artists?.some(artist => 
                        artist.name?.toLowerCase().includes(lowerQuery)
                    );
                    return titleMatch || artistMatch;
                });
                this._lastDownloadedResults = results;
            } else {
                // Online search
                const isOnline = await this._isOnline();
                if (!isOnline) {
                    this._showNotification('Search Failed', 'No internet connection', 'error');
                    return;
                }

                results = await this._performSearch(query);
                
                // Update download status efficiently
                const cacheDir = this._getOption('cacheDir');
                results = results.map(result => ({
                    ...result,
                    isDownloaded: GLib.file_test(
                        GLib.build_filenamev([cacheDir, `${result.videoId}.opus`]),
                        GLib.FileTest.EXISTS
                    )
                }));

                this._lastOnlineResults = results;
            }

            this._searchResults = results;
            this.notify('search-results');
        } catch (error) {
            logError(error);
            this._showNotification('Search Failed', error.message, 'error');
        } finally {
            this._loading = false;
            this.notify('loading');
        }
    }

    toggleDownloadedView() {
        this._showDownloaded = !this._showDownloaded;
        this.notify('show-downloaded');
        
        // Switch view immediately using cached results
        if (this._showDownloaded) {
            // If we have a search query, use filtered downloaded results
            if (this._currentSearchQuery) {
                this._searchResults = this._lastDownloadedResults;
            } else {
                this._searchResults = this._downloadedTracks;
            }
        } else {
            // Switch back to online results
            this._searchResults = this._lastOnlineResults;
        }
        this.notify('search-results');
        
        // Perform the search again in the background if we have a query
        if (this._currentSearchQuery) {
            this.search(this._currentSearchQuery).catch(logError);
        }
    }

    async _updateDownloadedTracks() {
        const cacheDir = this._getOption('cacheDir');
        const files = await Utils.execAsync(['find', cacheDir, '-name', '*.opus']);
        
        if (!files) {
            this._downloadedTracks = [];
            return;
        }

        const tracks = [];
        for (const file of files.split('\n').filter(Boolean)) {
            const videoId = GLib.path_get_basename(file).replace('.opus', '');
            const metadataFile = GLib.build_filenamev([cacheDir, `${videoId}.json`]);
            
            try {
                let trackInfo;
                if (GLib.file_test(metadataFile, GLib.FileTest.EXISTS)) {
                    // Read from cached metadata
                    const [ok, contents] = GLib.file_get_contents(metadataFile);
                    if (ok) {
                        trackInfo = JSON.parse(new TextDecoder().decode(contents));
                    }
                } else {
                    // Fetch and cache metadata
                    trackInfo = await this._getTrackInfo(videoId);
                    if (trackInfo) {
                        GLib.file_set_contents(
                            metadataFile,
                            JSON.stringify(trackInfo, null, 2)
                        );
                    }
                }
                
                if (trackInfo) {
                    tracks.push({
                        ...trackInfo,
                        isDownloaded: true,
                    });
                }
            } catch (error) {
                logError(error);
            }
        }

        this._downloadedTracks = tracks;
        this.notify('downloaded-tracks');
    }

    async cacheTrack(videoId) {
        if (!videoId) return;

        const cacheDir = this._getOption('cacheDir');
        const cachedFile = GLib.build_filenamev([cacheDir, `${videoId}.opus`]);
        const metadataFile = GLib.build_filenamev([cacheDir, `${videoId}.json`]);

        // If already cached, do nothing
        if (GLib.file_test(cachedFile, GLib.FileTest.EXISTS)) {
            this._updateCachingStatus(videoId, 'cached');
            return;
        }

        try {
            // Get track info first for notifications
            const trackInfo = await this._getTrackInfo(videoId);
            const url = `https://music.youtube.com/watch?v=${videoId}`;
            
            // Update status and notify about caching start
            this._updateCachingStatus(videoId, 'caching');
            this._showNotification(
                'Caching Song',
                `Starting to cache: ${trackInfo?.title || 'Unknown Song'}`
            );

            const quality = this._getOption('audioQuality');
            const audioFormat = AUDIO_FORMATS[quality] || AUDIO_FORMATS['high'];
            
            // Download the file to cache with proper encoding
            await Utils.execAsync([
                'yt-dlp',
                '--format', audioFormat,
                '--extract-audio',
                '--audio-format', 'opus',
                '--audio-quality', '0',
                '--output', cachedFile,
                '--no-playlist',
                '--force-encoding', 'UTF-8',
                url
            ]);
            
            // Cache metadata separately
            if (trackInfo) {
                GLib.file_set_contents(
                    metadataFile,
                    JSON.stringify(trackInfo, null, 2)
                );
            }
            
            // Verify file was downloaded
            if (GLib.file_test(cachedFile, GLib.FileTest.EXISTS)) {
                this._updateCachingStatus(videoId, 'cached');
                this._showNotification(
                    'Caching Complete',
                    `Successfully cached: ${trackInfo?.title || 'Unknown Song'}`
                );
                
                // Update downloaded tracks list
                await this._updateDownloadedTracks();
            } else {
                throw new Error('File not found after download');
            }
        } catch (e) {
            this._updateCachingStatus(videoId, 'error');
            this._showNotification(
                'Caching Failed',
                `Failed to cache: ${trackInfo?.title || 'Unknown Song'}`,
                'critical'
            );
        }
    }

    async _getTrackInfo(videoId) {
        if (!videoId) return null;
        try {
            return await YTMusicAPI.getTrackInfo(videoId);
        } catch (error) {
            console.error('Error getting track info:', error);
            return null;
        }
    }

    async _searchSongs(query) {
        if (!query) return [];
        try {
            return await YTMusicAPI.searchSongs(query);
        } catch (error) {
            console.error('Error searching songs:', error);
            return [];
        }
    }

    async _getRadio(videoId) {
        if (!videoId) return [];
        try {
            return await YTMusicAPI.getRadio(videoId);
        } catch (error) {
            console.error('Error getting radio:', error);
            return [];
        }
    }

    async _getAudioUrl(videoId) {
        try {
            if (!videoId) return null;

            const cacheDir = this._getOption('cacheDir');
            const cachedFile = GLib.build_filenamev([cacheDir, `${videoId}.opus`]);

            // Check if file exists in cache
            if (GLib.file_test(cachedFile, GLib.FileTest.EXISTS)) {
                this._updateCachingStatus(videoId, 'cached');
                return `file://${cachedFile}`;
            }

            // Check memory cache for URL
            const cached = this._audioUrlCache.get(videoId);
            if (cached) {
                const { data, timestamp } = cached;
                if (Date.now() - timestamp < this._cacheTimeout) {
                    return data;
                }
                this._audioUrlCache.delete(videoId);
            }

            const url = `https://music.youtube.com/watch?v=${videoId}`;
            
            // Get audio format based on quality setting
            const quality = this._getOption('audioQuality');
            const audioFormat = AUDIO_FORMATS[quality] || AUDIO_FORMATS['high'];
            
            // Update status and notify about caching start
            this._updateCachingStatus(videoId, 'caching');
            const trackInfo = await this._getTrackInfo(videoId);
            this._showNotification(
                'Caching Song',
                `Starting to cache: ${trackInfo?.title || 'Unknown Song'}`
            );
            
            // Download the file to cache
            try {
                await Utils.execAsync([
                    'yt-dlp',
                    '--format', audioFormat,
                    '--extract-audio',
                    '--audio-format', 'opus',
                    '--audio-quality', '0',
                    '--output', cachedFile,
                    '--no-playlist',
                    '--force-encoding', 'UTF-8',
                    url
                ]);
                
                // Verify file was downloaded
                if (GLib.file_test(cachedFile, GLib.FileTest.EXISTS)) {
                    this._updateCachingStatus(videoId, 'cached');
                    this._showNotification(
                        'Caching Complete',
                        `Successfully cached: ${trackInfo?.title || 'Unknown Song'}`
                    );
                    return `file://${cachedFile}`;
                }
            } catch (e) {
                this._updateCachingStatus(videoId, 'error');
                this._showNotification(
                    'Caching Failed',
                    `Failed to cache: ${trackInfo?.title || 'Unknown Song'}`,
                    'critical'
                );
            }
            
            // Fallback to streaming URL if download failed
            const result = await Utils.execAsync([
                'yt-dlp',
                '--format', audioFormat,
                '--get-url',
                '--no-playlist',
                url
            ]);
            
            if (!result) return null;
            
            const audioUrl = result.trim();
            
            // Cache the URL
            this._audioUrlCache.set(videoId, {
                data: audioUrl,
                timestamp: Date.now()
            });
            
            return audioUrl;
        } catch (error) {
            logError(error);
            this._updateCachingStatus(videoId, 'error');
            return null;
        }
    }

    _loadState() {
        try {
            if (GLib.file_test(this._stateFile, GLib.FileTest.EXISTS)) {
                const [ok, contents] = GLib.file_get_contents(this._stateFile);
                if (ok) {
                    const state = JSON.parse(new TextDecoder().decode(contents));
                    
                    // Restore state values
                    if (state.currentTrack) {
                        this._currentTrack = state.currentTrack;
                        this._currentVideoId = state.currentTrack.videoId;
                    }
                    if (state.playlist) this._playlist = state.playlist;
                    if (typeof state.volume === 'number') this._volume = state.volume;
                    if (typeof state.playing === 'boolean') this._playing = state.playing;
                    if (typeof state.repeat === 'boolean') this._repeat = state.repeat;
                    if (typeof state.shuffle === 'boolean') this._shuffle = state.shuffle;
                    if (state.searchResults) this._searchResults = state.searchResults;
                    if (typeof state.position === 'number') this._position = state.position;
                    if (typeof state.duration === 'number') this._duration = state.duration;
                    if (typeof state.loading === 'boolean') this._loading = state.loading;

                    // Restore caching status
                    if (state.cachingStatus) {
                        // Clear existing status
                        this._cachingStatus.clear();
                        
                        // For each cached song, verify it still exists in cache
                        const cacheDir = this._getOption('cacheDir');
                        Object.entries(state.cachingStatus).forEach(([videoId, status]) => {
                            if (status === 'cached') {
                                const cachedFile = GLib.build_filenamev([cacheDir, `${videoId}.opus`]);
                                if (GLib.file_test(cachedFile, GLib.FileTest.EXISTS)) {
                                    this._cachingStatus.set(videoId, status);
                                }
                            }
                        });
                        this.notify('caching-status');
                    }
                }
            }
        } catch (error) {
            // Ignore errors during state load
        }
    }

    _saveState() {
        try {
            const state = {
                currentTrack: this._currentTrack,
                playlist: this._playlist,
                volume: this._volume,
                playing: this._playing,
                repeat: this._repeat,
                shuffle: this._shuffle,
                searchResults: this._searchResults,
                position: this._position,
                duration: this._duration,
                loading: this._loading,
                cachingStatus: Object.fromEntries(this._cachingStatus),
            };

            // Ensure state directory exists
            const stateDir = GLib.path_get_dirname(this._stateFile);
            if (!GLib.file_test(stateDir, GLib.FileTest.EXISTS)) {
                GLib.mkdir_with_parents(stateDir, 0o755);
            }

            // Save state to file
            const contents = new TextEncoder().encode(JSON.stringify(state, null, 2));
            GLib.file_set_contents(this._stateFile, contents);
        } catch (error) {
            // Ignore errors during state save
        }
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '';
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async pause() {
        try {
            await this._setMpvProperty('pause', true);
            this._playing = false;
            this.notify('playing');
        } catch (error) {
            // Removed console logging
        }
    }

    async previous() {
        try {
            await Utils.execAsync(['bash', '-c', 'echo \'{ "command": ["playlist-prev"] }\' | socat - /tmp/mpv-socket']);
            await this._updatePlayingState();
        } catch (error) {
            // Removed console logging
        }
    }

    async next() {
        try {
            await Utils.execAsync(['bash', '-c', 'echo \'{ "command": ["playlist-next"] }\' | socat - /tmp/mpv-socket']);
            await this._updatePlayingState();
        } catch (error) {
            // Removed console logging
        }
    }

    async setVolume(volume) {
        try {
            await this._setMpvProperty('volume', volume);
            this._volume = volume;
            this.notify('volume');
        } catch (error) {
            // Removed console logging
        }
    }

    _updateTrackFromMpris() {
        if (!this._mprisPlayer) return;

        try {
            // Get metadata from MPRIS
            const metadata = this._mprisPlayer.metadata;
            if (!metadata) return;

            // Extract track info
            const title = metadata['xesam:title'] || '';
            const artist = metadata['xesam:artist']?.[0] || '';
            const artUrl = metadata['mpris:artUrl'] || '';
            const trackid = metadata['mpris:trackid'] || '';

            // Update current track
            if (this._currentTrack) {
                this._currentTrack.title = title;
                this._currentTrack.artists = [{ name: artist }];
                this._currentTrack.thumbnail = artUrl;
                this.notify('current-track');
            } else {
                this._currentTrack = {
                    title,
                    artists: [{ name: artist }],
                    thumbnail: artUrl,
                    videoId: trackid.split('/').pop()
                };
                this.notify('current-track');
            }

            // Update position and duration
            const length = metadata['mpris:length'] || 0;
            if (length > 0) {
                this._duration = Math.floor(length / 1000000);
                this.notify('duration');
            }

            const position = this._mprisPlayer.position || 0;
            if (position > 0) {
                this._position = Math.floor(position / 1000000);
                this.notify('position');
            }
        } catch (e) {
            logError('Error updating track from MPRIS:', e);
        }
    }

    async _getMpvProperty(property) {
        try {
            const result = await Utils.execAsync(['bash', '-c', `
                echo '{ "command": ["get_property", "${property}"] }' | socat - /tmp/mpv-socket
            `]);
            return JSON.parse(result)?.data;
        } catch (e) {
            // Removed console logging
            return null;
        }
    }

    async _setMpvProperty(property, value) {
        try {
            await Utils.execAsync(['bash', '-c', `
                echo '{ "command": ["set_property", "${property}", ${JSON.stringify(value)}] }' | socat - /tmp/mpv-socket
            `]);
            return true;
        } catch (e) {
            // Removed console logging
            return false;
        }
    }

    // MPV control methods
    _togglePlayPause() {
        Utils.execAsync(['bash', '-c', 'echo "cycle pause" | socat - /tmp/mpv-socket']);
    }

    togglePlay() {
        this._togglePlayPause();
        this.playing = !this.playing;
    }

    _showNotification(summary, body = '', urgency = 'normal') {
        Notifications.Notify('YTMusic', 0, 'music', summary, body, [], {}, 3000);
    }

    _updateCachingStatus(videoId, status) {
        this._cachingStatus.set(videoId, status);
        this.notify('caching-status');
    }

    _initDownloadedTracks() {
        // Initial load of downloaded tracks
        this._updateDownloadedTracks();
        
        // Set up file monitoring
        const cacheDir = this._getOption('cacheDir');
        Utils.execAsync(['mkdir', '-p', cacheDir]).then(() => {
            const file = Gio.File.new_for_path(cacheDir);
            this._monitor = file.monitor_directory(Gio.FileMonitorFlags.NONE, null);
            this._monitor.connect('changed', (monitor, changedFile, otherFile, eventType) => {
                if (eventType === Gio.FileMonitorEvent.CREATED ||
                    eventType === Gio.FileMonitorEvent.DELETED) {
                    this._updateDownloadedTracks();
                }
            });
        });
    }

    _cleanupCache() {
        const now = Date.now();
        const cacheDir = this._getOption('cacheDir');
        const maxCacheSize = this._getOption('maxCacheSize');
        
        // Cleanup memory caches
        for (const [key, { timestamp }] of this._audioUrlCache.entries()) {
            if (now - timestamp > this._cacheTimeout) {
                this._audioUrlCache.delete(key);
            }
        }
        
        for (const [key, { timestamp }] of this._trackInfoCache.entries()) {
            if (now - timestamp > this._cacheTimeout) {
                this._trackInfoCache.delete(key);
            }
        }

        // Cleanup disk cache if it exceeds max size
        try {
            let totalSize = 0;
            const files = [];
            
            // Get all cached files and their info
            if (GLib.file_test(cacheDir, GLib.FileTest.EXISTS)) {
                const dir = Gio.File.new_for_path(cacheDir);
                const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
                
                let fileInfo;
                while ((fileInfo = enumerator.next_file(null)) !== null) {
                    const path = GLib.build_filenamev([cacheDir, fileInfo.get_name()]);
                    const size = fileInfo.get_size();
                    const accessTime = fileInfo.get_access_time().tv_sec;
                    files.push({ path, size, accessTime });
                    totalSize += size;
                }
            }

            // If cache exceeds max size, delete oldest files until under limit
            if (totalSize > maxCacheSize) {
                files.sort((a, b) => a.accessTime - b.accessTime);
                
                for (const file of files) {
                    if (totalSize <= maxCacheSize) break;
                    
                    try {
                        GLib.unlink(file.path);
                        totalSize -= file.size;
                    } catch (e) {
                        logError(e);
                    }
                }
            }
        } catch (e) {
            logError(e);
        }
    }

    async _initDefaultContent() {
        try {
            this._loading = true;
            this.notify('loading');
            
            const isOnline = await this._isOnline();
            if (!isOnline) {
                this._defaultContent = this._downloadedTracks.slice(0, 20);
                return;
            }

            // Get trending/recommended music
            const results = await YTMusicAPI.getTrending();
            
            // Update download status
            const cacheDir = this._getOption('cacheDir');
            this._defaultContent = results.map(result => ({
                ...result,
                isDownloaded: GLib.file_test(
                    GLib.build_filenamev([cacheDir, `${result.videoId}.opus`]),
                    GLib.FileTest.EXISTS
                )
            }));

            // If no search is active, show default content
            if (!this._currentSearchQuery) {
                this._searchResults = this._showDownloaded ? this._downloadedTracks : this._defaultContent;
                this.notify('search-results');
            }
        } catch (error) {
            logError(error);
            // Fallback to downloaded tracks if available
            this._defaultContent = this._downloadedTracks.slice(0, 20);
        } finally {
            this._loading = false;
            this.notify('loading');
        }
    }

    _notifyError(message) {
        Notifications.notify({
            summary: 'YouTube Music Error',
            body: message,
            icon: 'error',
            urgency: 'normal',
        });
    }

    _handleError(error, operation) {
        console.error(`Error during ${operation}:`, error);
        this._notifyError(`Failed to ${operation}: ${error.message}`);
        this.emit('error', error);
    }

    _getCached(key) {
        const cached = this._cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this._cacheTimeout * 1000) {
            this._cache.delete(key);
            return null;
        }
        return cached.data;
    }

    _setCache(key, data) {
        this._cache.set(key, {
            data,
            timestamp: Date.now(),
        });
        this._cleanCache();
    }

    _cleanCache() {
        const now = Date.now();
        for (const [key, value] of this._cache.entries()) {
            if (now - value.timestamp > this._cacheTimeout * 1000) {
                this._cache.delete(key);
            }
        }
    }
}

// Export the service
const service = new YouTubeMusicService();
export default service;
