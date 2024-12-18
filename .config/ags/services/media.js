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
    #positionBinding = null;

    constructor() {
        super();
        this._setupPlayerTracking();
        Mpris.connect('changed', () => this._onPlayerChanged());
    }

    _setupPlayerTracking() {
        this.#player = Mpris.getPlayer();
        if (this.#player) {
            this.#lastPlayerName = this.#player.identity;
            this.notify('changed');
            this._setupPlayerBindings();
        }
    }

    _onPlayerChanged() {
        const newPlayer = Mpris.getPlayer();
        if (newPlayer !== this.#player) {
            this.#player = newPlayer;
            this.notify('changed');
            this._setupPlayerBindings();
        }
    }

    _setupPlayerBindings() {
        if (this.#positionBinding) {
            this.#positionBinding.unbind();
            this.#positionBinding = null;
        }

        if (this.#player) {
            this.#positionBinding = this.#player.bind('position', this, 'position');
        }
    }

    get player() { return this.#player; }
    get playerName() { return this.#player?.identity || ''; }
    get title() { return this.#player?.trackTitle || ''; }
    get artist() { return this.#player?.trackArtists?.join(', ') || ''; }
    get artUrl() { return this.#player?.trackCoverUrl || ''; }
    get position() { return this.#player?.position || 0; }
}

export default new LocalMediaService();
