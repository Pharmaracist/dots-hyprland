import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';

const MUSIC_DIR = GLib.build_filenamev([GLib.get_home_dir(), 'Music']);

class MediaService extends Service {
    static {
        Service.register(this, {
            'songs-updated': ['jsobject'],
            'song-changed': ['jsobject'], 
            'status-changed': ['boolean'], 
            'metadata': ['jsobject'], 
            'position': ['float'], 
        });
    }

    _songs = [];
    _currentSong = null;
    _isPlaying = false;
    _metadata = new Map();
    _position = 0;
    _updateInterval = null;

    constructor() {
        super();

        // Start MPD if not running
        Utils.execAsync(['systemctl', '--user', 'start', 'mpd']).catch(console.error);

        // Initial update
        this._initMPD();
        
        // Set up position update interval
        this._updateInterval = setInterval(() => {
            this._updatePosition();
        }, 1000);
    }

    async _initMPD() {
        try {
            // Clear and rescan MPD database
            await Utils.execAsync(['mpc', 'clear']);
            await Utils.execAsync(['mpc', 'update', '--wait']);
            await Utils.execAsync(['mpc', 'add', '/']);
            
            // Get initial state
            await this._updateState();
            
            // Set up file monitoring for Music directory
            const file = Gio.File.new_for_path(MUSIC_DIR);
            const monitor = file.monitor_directory(Gio.FileMonitorFlags.NONE, null);
            monitor.connect('changed', () => {
                Utils.execAsync(['mpc', 'update', '--wait']).then(() => {
                    this.refresh();
                });
            });

            // Initial refresh
            this.refresh();
        } catch (error) {
            console.error('Error initializing MPD:', error);
        }
    }

    async _updateState() {
        try {
            const status = await Utils.execAsync(['mpc', 'status']);
            const lines = status.split('\n');
            
            if (lines.length > 1) {
                // Update current song and get metadata
                const currentSong = lines[0];
                const metadata = await this._getCurrentMetadata();
                
                // Update state with metadata
                this._currentSong = {
                    name: currentSong,
                    ...metadata
                };
                
                // Emit current song with metadata
                this.emit('song-changed', this._currentSong);

                // Update playback status
                const isPlaying = lines[1].includes('[playing]');
                if (this._isPlaying !== isPlaying) {
                    this._isPlaying = isPlaying;
                    this.emit('status-changed', isPlaying);
                }

                // Store metadata
                if (metadata) {
                    this._metadata.set(currentSong, metadata);
                    this.emit('metadata', metadata);
                }
            } else {
                this._currentSong = null;
                this.emit('song-changed', null);
            }
        } catch (error) {
            console.error('Error updating MPD state:', error);
        }
    }

    async _updatePosition() {
        if (!this._currentSong) return;
        
        try {
            const status = await Utils.execAsync(['mpc', 'status', '%position%']);
            const position = parseInt(status) || 0;
            if (position !== this._position) {
                this._position = position;
                this.emit('position', position);
            }
        } catch (error) {
            console.error('Error updating position:', error);
        }
    }

    async _getCurrentMetadata() {
        try {
            const format = '%title%\\n%artist%\\n%album%\\n%time%';
            const output = await Utils.execAsync(['mpc', 'current', '-f', format]);
            const [title, artist, album, time] = output.split('\n');
            
            return {
                title: title || 'Unknown Title',
                artist: artist || 'Unknown Artist',
                album: album || 'Unknown Album',
                duration: time ? this._parseTime(time) : 0
            };
        } catch (error) {
            console.error('Error getting metadata:', error);
            return {
                title: 'Unknown Title',
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                duration: 0
            };
        }
    }

    _parseTime(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 0;
    }

    async refresh() {
        try {
            const playlist = await Utils.execAsync(['mpc', 'playlist']);
            this._songs = playlist.split('\n').filter(s => s);
            this.emit('songs-updated', this._songs);
            
            // Update current state after refresh
            await this._updateState();
        } catch (error) {
            console.error('Error refreshing playlist:', error);
        }
    }

    getMetadata(song) {
        if (typeof song === 'object' && song !== null) {
            return song; // Already has metadata
        }
        return this._metadata.get(song) || {
            title: song,
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0
        };
    }

    async playSong(song) {
        if (!song) return;
        
        try {
            const songName = typeof song === 'object' ? song.name : song;
            const index = this._songs.indexOf(songName) + 1;
            if (index > 0) {
                await Utils.execAsync(['mpc', 'play', index.toString()]);
                await this._updateState();
            }
        } catch (error) {
            console.error('Error playing song:', error);
        }
    }

    async togglePlay() {
        try {
            await Utils.execAsync(['mpc', 'toggle']);
            await this._updateState();
        } catch (error) {
            console.error('Error toggling playback:', error);
        }
    }

    async stop() {
        try {
            await Utils.execAsync(['mpc', 'stop']);
            await this._updateState();
        } catch (error) {
            console.error('Error stopping playback:', error);
        }
    }

    get songs() { return this._songs; }
    get currentSong() { return this._currentSong; }
    get isPlaying() { return this._isPlaying; }
    get position() { return this._position; }

    destroy() {
        if (this._updateInterval) {
            clearInterval(this._updateInterval);
        }
        super.destroy();
    }
}

const service = new MediaService();
export default service;
