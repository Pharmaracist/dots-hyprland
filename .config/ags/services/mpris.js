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

        this.#player = Mpris.players[0] || null;
        
        if (this.#player) {
            this.emit('player-changed', this.#player.identity || '');
            this.emit('track-changed', this.trackInfo);

            this.#interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                if (!this.#player) return GLib.SOURCE_REMOVE;
                this.#position = this.#player.position;
                this.emit('position-changed', this.position);
                return GLib.SOURCE_CONTINUE;
            });
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
