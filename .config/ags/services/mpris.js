import Service from 'resource:///com/github/Aylur/ags/service.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GLib from 'gi://GLib';

class CustomMediaService extends Service {
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
        this.#setupPlayer();
        Mpris.connect('changed', () => this.#setupPlayer());
    }

    #setupPlayer() {
        if (this.#interval) {
            GLib.source_remove(this.#interval);
            this.#interval = null;
        }

        // Find a suitable player
        this.#player = Mpris.players.find(p => 
            !p.busName.startsWith('org.mpris.MediaPlayer2.playerctld') &&
            !(p.busName.endsWith('.mpd') && !p.busName.endsWith('MediaPlayer2.mpd'))
        ) || null;
        
        if (this.#player) {
            this.emit('player-changed', this.#player.identity || '');
            this.emit('track-changed', this.trackInfo);

            // Track position changes
            this.#interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                if (!this.#player || !this.#player.busName) {
                    this.#position = 0;
                    return GLib.SOURCE_REMOVE;
                }
                
                try {
                    this.#position = this.#player.position || 0;
                    this.emit('position-changed', this.position);
                } catch (error) {
                    console.error('Error updating position:', error);
                    return GLib.SOURCE_REMOVE;
                }
                
                return GLib.SOURCE_CONTINUE;
            });

            // Listen for property changes
            this.#player.connect('changed', () => {
                this.emit('track-changed', this.trackInfo);
            });
        } else {
            this.#position = 0;
            this.emit('player-changed', '');
            this.emit('track-changed', null);
        }
    }

    get player() { return this.#player; }
    get position() { return this.#position; }
    get trackInfo() {
        if (!this.#player) return null;
        return {
            title: this.#player.trackTitle || '',
            artist: this.#player.trackArtists?.join(', ') || '',
            album: this.#player.trackAlbum || '',
            artUrl: this.#player.trackCoverUrl || '',
            length: this.#player.length || 0,
        };
    }
}

export default new CustomMediaService();
