import Service from 'resource:///com/github/Aylur/ags/service.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
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
    #mpd = null;

    constructor() {
        super();
        this._setupMPD();
        this._setupPlayerTracking();
        Mpris.connect('changed', () => this._onPlayerChanged());
    }

    async _setupMPD() {
        try {
            // Start MPD if not running
            const mpdStatus = await Utils.execAsync(['systemctl', '--user', 'status', 'mpd']);
            if (!mpdStatus.includes('active (running)')) {
                await Utils.execAsync(['systemctl', '--user', 'start', 'mpd']);
            }
            
            // Create MPD config directory if it doesn't exist
            const mpdDir = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'mpd']);
            if (!GLib.file_test(mpdDir, GLib.FileTest.EXISTS)) {
                GLib.mkdir_with_parents(mpdDir, 0o755);
            }

            // Create music directory if it doesn't exist
            const musicDir = GLib.build_filenamev([GLib.get_home_dir(), 'Music']);
            if (!GLib.file_test(musicDir, GLib.FileTest.EXISTS)) {
                GLib.mkdir_with_parents(musicDir, 0o755);
            }

            // Update MPD database
            await Utils.execAsync(['mpc', 'update']);
        } catch (error) {
            console.error('Error setting up MPD:', error);
        }
    }

    _setupPlayerTracking() {
        try {
            this.#player = Mpris.getPlayer('mpd') || Mpris.getPlayer();
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
            const newPlayer = Mpris.getPlayer('mpd') || Mpris.getPlayer();
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

    async play(uri) {
        try {
            if (uri) {
                await Utils.execAsync(['mpc', 'clear']);
                await Utils.execAsync(['mpc', 'add', uri]);
            }
            await Utils.execAsync(['mpc', 'play']);
        } catch (error) {
            console.error('Error playing:', error);
        }
    }

    async pause() {
        try {
            await Utils.execAsync(['mpc', 'pause']);
        } catch (error) {
            console.error('Error pausing:', error);
        }
    }

    async next() {
        try {
            await Utils.execAsync(['mpc', 'next']);
        } catch (error) {
            console.error('Error skipping track:', error);
        }
    }

    async previous() {
        try {
            await Utils.execAsync(['mpc', 'prev']);
        } catch (error) {
            console.error('Error going to previous track:', error);
        }
    }
}

export default new LocalMediaService();
