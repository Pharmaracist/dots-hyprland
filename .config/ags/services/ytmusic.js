import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

class YouTubeMusicService extends Service {
    static {
        Service.register(this, {
            'search-results': ['jsobject'],
            'current-track': ['jsobject'],
            'playing': ['boolean'],
            'volume': ['float'],
        });
    }

    _currentTrack = null;
    _searchResults = [];
    _playing = false;
    _mprisPlayer = null;
    _volume = 1.0;
    _mpvProcess = null;
    _mpvSocket = '/tmp/mpv-ytmusic.socket';
    _metadataFile = '/tmp/mpv-ytmusic-metadata.json';

    constructor() {
        super();
        console.log('YTMusic service initialized');
        this._initializeState();

        // Watch for MPRIS player changes
        Mpris.connect('player-changed', () => {
            console.log('MPRIS player changed');
            const player = Mpris.players.find(p => p.identity === 'ytmusic');
            if (player) {
                console.log('Found YTMusic MPRIS player');
                this._mprisPlayer = player;
                this._updateFromMpris();
                this._loadSavedMetadata();
            } else {
                console.log('No YTMusic MPRIS player found');
                this._mprisPlayer = null;
            }
        });
    }

    // Initialize state
    async _initializeState() {
        try {
            // Check if mpv is running with our socket
            const mpvRunning = await Utils.execAsync(['pgrep', '-f', `mpv.*${this._mpvSocket}`])
                .then(() => true)
                .catch(() => false);

            if (!mpvRunning) {
                // No running instance, clean up
                await this._cleanupOldInstances();
            } else {
                // Instance running, try to load its state
                console.log('Found running mpv instance');
                await this._loadSavedMetadata();
            }
        } catch (error) {
            console.error('YTMusic: State initialization failed:', error);
        }
    }

    // Save current track metadata
    async _saveMetadata() {
        if (!this._currentTrack) return;
        
        try {
            await Utils.writeFile(JSON.stringify(this._currentTrack), this._metadataFile);
        } catch (error) {
            console.error('YTMusic: Failed to save metadata:', error);
        }
    }

    // Load saved metadata
    async _loadSavedMetadata() {
        try {
            const data = await Utils.readFile(this._metadataFile);
            if (data) {
                this._currentTrack = JSON.parse(data);
                this.emit('current-track', this._currentTrack);
                
                // Update playing state from MPRIS
                if (this._mprisPlayer) {
                    this._playing = this._mprisPlayer.playBackStatus === 'Playing';
                    this.emit('playing', this._playing);
                }
            }
        } catch (error) {
            console.error('YTMusic: Failed to load metadata:', error);
        }
    }

    // Cleanup any existing instances
    async _cleanupOldInstances() {
        try {
            // Kill any existing mpv instances for YTMusic
            await Utils.execAsync(['pkill', '-f', `mpv.*${this._mpvSocket}`]);
            // Remove the socket and metadata files
            await Utils.execAsync(['rm', '-f', this._mpvSocket, this._metadataFile]);
        } catch (error) {
            console.log('No existing mpv instances to cleanup');
        }
    }

    // Update state from MPRIS
    _updateFromMpris() {
        if (!this._mprisPlayer) return;
        
        this._playing = this._mprisPlayer.playBackStatus === 'Playing';
        this.emit('playing', this._playing);
        
        this._volume = this._mprisPlayer.volume;
        this.emit('volume', this._volume);
    }

    // Search for tracks
    async search(query) {
        if (!query) return;
        
        try {
            const scriptPath = `${App.configDir}/services/ytmusic_helper.py`;
            const response = await Utils.execAsync([scriptPath, query]);
            
            if (!response) return;
            
            try {
                const results = JSON.parse(response);
                if (Array.isArray(results)) {
                    this._searchResults = results;
                    this.emit('search-results', this._searchResults);
                }
            } catch (error) {
                console.error('YTMusic: Search parse error:', error);
            }
        } catch (error) {
            console.error('YTMusic: Search failed:', error);
        }
    }

    // Play track by videoId
    async play(videoId) {
        if (!videoId) return;

        try {
            // Get track info
            const info = await this._getTrackInfo(videoId);
            if (!info) return;

            // Update current track
            this._currentTrack = {
                videoId,
                title: info.title,
                artists: info.artists,
                album: info.album,
                thumbnail: info.thumbnail,
            };
            this.emit('current-track', this._currentTrack);

            // Save metadata for persistence
            await this._saveMetadata();

            // Kill existing mpv process if any
            await this._cleanupOldInstances();

            // Start playback with mpv
            const url = `https://music.youtube.com/watch?v=${videoId}`;
            this._mpvProcess = Utils.subprocess([
                'mpv',
                '--no-video',
                '--volume=100',
                '--force-window=no',
                '--ytdl-format=bestaudio',
                '--player-operation-mode=pseudo-gui',
                `--input-ipc-server=${this._mpvSocket}`,
                '--keep-open=no',
                '--idle=no',
                '--audio-display=no',
                // Add proper MPRIS support
                '--script=/usr/share/mpv/scripts/mpris.so',
                '--mpris-name=ytmusic',
                // Add metadata
                `--metadata-append=title=${info.title}`,
                `--metadata-append=artist=${info.artists?.map(a => a.name).join(', ')}`,
                `--metadata-append=album=${info.album || ''}`,
                // Add cover art
                `--cover-art-file=${info.thumbnail}`,
                url
            ], (output) => {
                console.log('MPV output:', output);
            }, (error) => {
                console.error('MPV error:', error);
                this._currentTrack = null;
                this.emit('current-track', null);
                this._playing = false;
                this.emit('playing', false);
                // Clean up metadata on exit
                Utils.execAsync(['rm', '-f', this._metadataFile]);
            });

            this._playing = true;
            this.emit('playing', true);

            // Poll MPRIS state to ensure sync
            this._pollMprisState();
        } catch (error) {
            console.error('YTMusic: Play failed:', error);
            this._currentTrack = null;
            this.emit('current-track', null);
            this._playing = false;
            this.emit('playing', false);
        }
    }

    // Poll MPRIS state to ensure sync
    async _pollMprisState() {
        const checkState = async () => {
            const player = Mpris.players.find(p => p.identity === 'ytmusic');
            if (player) {
                this._playing = player.playBackStatus === 'Playing';
                this.emit('playing', this._playing);
                this._volume = player.volume;
                this.emit('volume', this._volume);
            }
        };

        // Check immediately
        await checkState();

        // Then check every second
        const interval = Utils.interval(1000, async () => {
            if (!this._currentTrack) {
                Utils.timeout.clearInterval(interval);
                return;
            }
            await checkState();
        });
    }

    // Stop playback
    async _stopPlayback() {
        await this._cleanupOldInstances();
        this._currentTrack = null;
        this.emit('current-track', null);
        this._playing = false;
        this.emit('playing', false);
    }

    // Get track info
    async _getTrackInfo(videoId) {
        try {
            const scriptPath = `${App.configDir}/services/ytmusic_helper.py`;
            const response = await Utils.execAsync([scriptPath, '--info', videoId]);
            
            if (!response) return null;
            
            try {
                const info = JSON.parse(response);
                return info;
            } catch (error) {
                console.error('YTMusic: Track info parse error:', error);
                return null;
            }
        } catch (error) {
            console.error('YTMusic: Get track info failed:', error);
            return null;
        }
    }

    // Send IPC command to MPV
    async _sendCommand(command) {
        if (!this._mpvSocket) return;
        try {
            await Utils.execAsync(['socat', '-', this._mpvSocket], {
                input: JSON.stringify(command) + '\n'
            });
        } catch (error) {
            console.error('Failed to send command to MPV:', error);
        }
    }

    // Set volume (0.0 to 1.0)
    async setVolume(value) {
        this._volume = Math.max(0, Math.min(1, value));
        await this._sendCommand({ command: ['set_property', 'volume', this._volume * 100] });
        this.emit('volume', this._volume);
    }

    // Play/Pause toggle
    async togglePlay() {
        if (this._playing) {
            await this.pause();
        } else {
            await this.resume();
        }
    }

    // Resume playback
    async resume() {
        await this._sendCommand({ command: ['set_property', 'pause', false] });
        this._playing = true;
        this.emit('playing', true);
    }

    // Pause playback
    async pause() {
        await this._sendCommand({ command: ['set_property', 'pause', true] });
        this._playing = false;
        this.emit('playing', false);
    }

    // Previous track
    async previous() {
        try {
            await Utils.execAsync(['playerctl', '--player=mpv', 'previous']);
        } catch (error) {
            console.error('YTMusic: Previous failed:', error);
        }
    }

    // Next track
    async next() {
        try {
            await Utils.execAsync(['playerctl', '--player=mpv', 'next']);
        } catch (error) {
            console.error('YTMusic: Next failed:', error);
        }
    }

    // Get current state
    get playing() { return this._playing; }
    get currentTrack() { return this._currentTrack; }
    get searchResults() { return this._searchResults; }
    get volume() { return this._volume; }
}

// Export the service
const service = new YouTubeMusicService();
export default service;
