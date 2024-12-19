import Service from 'resource:///com/github/Aylur/ags/service.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GLib from 'gi://GLib';

class LocalMediaService extends Service {
    static {
        Service.register(this, {
            'changed': [],
            'position': ['float'],
            'player-name': ['string'],
            'title': ['string'],
            'artist': ['string'],
            'art-url': ['string'],
        });
    }

    #player = null;
    #lastPlayerName = '';
    #lastTitle = '';

    constructor() {
        super();
        this._setupPlayerTracking();
        Mpris.connect('changed', () => this._onPlayerChanged());
    }

    _setupPlayerTracking() {
        try {
            this.#player = Mpris.getPlayer();
            if (this.#player) {
                this.#lastPlayerName = this.#player.identity;
                this.#lastTitle = this.#player.trackTitle;
                this.emit('changed');
            }
        } catch (error) {
            console.error('Error setting up player tracking:', error);
        }
    }

    _onPlayerChanged() {
        try {
            const newPlayer = Mpris.getPlayer();
            const newTitle = newPlayer?.trackTitle;
            
            if (newPlayer !== this.#player || newTitle !== this.#lastTitle) {
                this.#player = newPlayer;
                this.#lastTitle = newTitle;
                this.emit('changed');
            }
        } catch (error) {
            console.error('Error handling player change:', error);
        }
    }

    get player() {
        return this.#player;
    }

    get title() {
        return this.#player?.trackTitle || '';
    }

    get artist() {
        return this.#player?.trackArtists?.join(', ') || '';
    }
}

export default new LocalMediaService();
