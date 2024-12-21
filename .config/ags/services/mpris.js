import Service from 'resource:///com/github/Aylur/ags/service.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GLib from 'gi://GLib';

class CustomMediaService extends Service {
    static {
        Service.register(this, {}, {
            'player': ['string'],
            'track': ['jsobject'],
            'position': ['float'],
        });
    }

    #player = null;
    #interval = null;
    #position = 0;
    #playerChangedHandler = null;

    constructor() {
        super();
        this.#setupPlayer();
        this.#playerChangedHandler = Mpris.connect('changed', () => this.#setupPlayer());
    }

    getPlayer() {
        return this.#player;
    }

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

    get position() {
        return this.#position;
    }

    #setupPlayer() {
        if (this.#interval) {
            GLib.source_remove(this.#interval);
            this.#interval = null;
        }

        if (this.#player) {
            this.#player.disconnect('changed');
        }

        // Find a suitable player
        this.#player = Mpris.players.find(p => 
            !p.busName.startsWith('org.mpris.MediaPlayer2.playerctld') &&
            !(p.busName.endsWith('.mpd') && !p.busName.endsWith('MediaPlayer2.mpd'))
        ) || null;
        
        if (this.#player) {
            this.notify('player');
            this.notify('track');

            // Track position changes
            this.#interval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                if (!this.#player || !this.#player.busName) {
                    this.#position = 0;
                    return GLib.SOURCE_REMOVE;
                }
                
                try {
                    this.#position = this.#player.position || 0;
                    this.notify('position');
                } catch (error) {
                    console.error('Error updating position:', error);
                    return GLib.SOURCE_REMOVE;
                }
                
                return GLib.SOURCE_CONTINUE;
            });

            // Listen for property changes
            this.#player.connect('changed', () => {
                this.notify('track');
            });
        } else {
            this.#position = 0;
            this.notify('player');
            this.notify('track');
        }
    }

    destroy() {
        if (this.#interval) {
            GLib.source_remove(this.#interval);
            this.#interval = null;
        }

        if (this.#player) {
            this.#player.disconnect('changed');
        }

        if (this.#playerChangedHandler) {
            Mpris.disconnect(this.#playerChangedHandler);
        }

        super.destroy();
    }
}

const service = new CustomMediaService();
export default service;
