import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GLib from 'gi://GLib';

class MediaService extends Service {
    static {
        Service.register(this, {
            'player-changed': ['string'],
            'position-changed': ['float'],
            'track-changed': ['jsobject'],
        });
    }

    #player = null;
    #interval = null;
    #position = 0;

    constructor() {
        super();

        // Initialize with first available player
        this.#setupPlayer();

        // Watch for player changes
        Mpris.connect('player-added', () => this.#setupPlayer());
        Mpris.connect('player-removed', () => this.#setupPlayer());
    }

    #setupPlayer() {
        if (this.#interval) {
            GLib.source_remove(this.#interval);
            this.#interval = null;
        }

        // Get first available player
        this.#player = Mpris.players[0] || null;
        
        if (this.#player) {
            this.emit('player-changed', this.#player.identity || '');
            this.emit('track-changed', this.trackInfo);

            // Update position every second
            this.#interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                if (!this.#player) return GLib.SOURCE_REMOVE;
                this.#position = this.#player.position;
                this.emit('position-changed', this.position);
                return GLib.SOURCE_CONTINUE;
            });

            // Watch for track changes
            this.#player.connect('notify::track-title', () => {
                this.emit('track-changed', this.trackInfo);
            });
        }
    }

    get player() { return this.#player; }
    get position() { return this.#position / 1000000; } // Convert to seconds
    get trackInfo() {
        if (!this.#player) return {};
        
        return {
            title: this.#player.trackTitle || '',
            artist: this.#player.trackArtists?.join(', ') || '',
            album: this.#player.trackAlbum || '',
            artUrl: this.#player.trackArtUrl || '',
            length: this.#player.length / 1000000 || 0,
            canPlay: this.#player.canPlay || false,
            canPause: this.#player.canPause || false,
            canGoNext: this.#player.canGoNext || false,
            canGoPrev: this.#player.canGoPrevious || false,
            canSeek: this.#player.canSeek || false,
            shuffle: this.#player.shuffle || false,
            loopStatus: this.#player.loopStatus || 'None',
        };
    }

    // Control methods
    playPause() { this.#player?.playPause(); }
    play() { this.#player?.play(); }
    pause() { this.#player?.pause(); }
    next() { this.#player?.next(); }
    previous() { this.#player?.previous(); }
    shuffle() { if (this.#player) this.#player.shuffle = !this.#player.shuffle; }
    setLoopStatus(status) { if (this.#player) this.#player.loopStatus = status; }
    seek(position) { this.#player?.seek(position * 1000000); }
}

export default new MediaService();
