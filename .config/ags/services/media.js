import Service from 'resource:///com/github/Aylur/ags/service.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GLib from 'gi://GLib';

class MediaService extends Service {
    static {
        Service.register(this);
    }

    #player = null;
    #lastPlayerName = '';
    #positionBinding = null;

    constructor() {
        super();

        // Initialize player tracking
        this._setupPlayerTracking();

        // Connect to Mpris signals
        Mpris.connect('player-added', (_, name) => {
            this._onPlayerAdded(name);
        });

        Mpris.connect('changed', () => {
            this._onPlayerChanged();
        });
    }

    _setupPlayerTracking() {
        // Initial player setup
        this.#player = Mpris.getPlayer();
        if (this.#player) {
            this.#lastPlayerName = this.#player.identity;
            this.emit('changed');
            this._setupPlayerBindings();
        }
    }

    _onPlayerAdded(name) {
        if (!this.#player || name === this.#lastPlayerName) {
            this.#lastPlayerName = name;
            this.#player = Mpris.getPlayer(name);
            this.emit('changed');
            this._setupPlayerBindings();
        }
    }

    _onPlayerChanged() {
        const newPlayer = Mpris.getPlayer();
        if (newPlayer !== this.#player) {
            this.#player = newPlayer;
            this.#lastPlayerName = newPlayer?.identity || '';
            this.emit('changed');
            this._setupPlayerBindings();
        }
    }

    _setupPlayerBindings() {
        // Clean up previous binding
        if (this.#positionBinding) {
            GLib.source_remove(this.#positionBinding);
            this.#positionBinding = null;
        }

        // Set up new binding if we have a player
        if (this.#player) {
            this.#positionBinding = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                if (this.#player && !this.#player.closed) {
                    this.emit('changed');
                    return GLib.SOURCE_CONTINUE;
                }
                this.#positionBinding = null;
                return GLib.SOURCE_REMOVE;
            });

            // Connect to player signals
            this.#player.connect('changed', () => {
                this.emit('changed');
            });
        }
    }

    get player() {
        return this.#player;
    }

    get position() {
        return this.#player?.position || 0;
    }

    set position(value) {
        if (this.#player?.canSeek) {
            this.#player.position = value;
        }
    }

    get length() {
        return this.#player?.length || 0;
    }

    get canPlay() {
        return this.#player?.canPlay || false;
    }

    get canPause() {
        return this.#player?.canPause || false;
    }

    get canGoNext() {
        return this.#player?.canGoNext || false;
    }

    get canGoPrev() {
        return this.#player?.canGoPrev || false;
    }

    get canSeek() {
        return this.#player?.canSeek || false;
    }

    get playbackStatus() {
        return this.#player?.playbackStatus || 'Stopped';
    }

    get trackTitle() {
        return this.#player?.trackTitle || '';
    }

    get trackArtists() {
        return this.#player?.trackArtists || [];
    }

    get trackCoverUrl() {
        return this.#player?.trackCoverUrl || '';
    }

    play() {
        if (this.#player?.canPlay) {
            this.#player.play();
        }
    }

    pause() {
        if (this.#player?.canPause) {
            this.#player.pause();
        }
    }

    playPause() {
        if (this.#player) {
            if (this.playbackStatus === 'Playing' && this.canPause) {
                this.pause();
            } else if (this.canPlay) {
                this.play();
            }
        }
    }

    next() {
        if (this.#player?.canGoNext) {
            this.#player.next();
        }
    }

    previous() {
        if (this.#player?.canGoPrev) {
            this.#player.previous();
        }
    }

    seek(offset) {
        if (this.#player?.canSeek) {
            this.#player.seek(offset);
        }
    }

    destroy() {
        if (this.#positionBinding) {
            GLib.source_remove(this.#positionBinding);
            this.#positionBinding = null;
        }
        super.destroy();
    }
}

export default new MediaService();
