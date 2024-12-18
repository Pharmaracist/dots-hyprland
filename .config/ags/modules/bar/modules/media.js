import Widget from "resource:///com/github/Aylur/ags/widget.js";
import GLib from "gi://GLib";
import LocalMedia from "../../../services/media.js";
import YTMusic from "../../../services/ytmusic.js";

const CYCLE_INTERVAL = 5000; // 5 seconds
const MODES = ['TITLE', 'ARTIST', 'SOURCE'];

const MediaIndicator = () => {
    let currentMode = 0;
    let timeout = null;

    const label = Widget.Label({
        className: "txt-norm media-label",
        truncate: "end",
        maxWidthChars: 40,
    });

    const icon = Widget.Label({
        className: "txt-norm icon-material",
    });

    const getCurrentTrack = () => {
        if (YTMusic.playing && YTMusic._currentTrack) {
            return {
                title: YTMusic._currentTrack.title,
                artist: YTMusic._currentTrack.artist,
                source: 'YouTube Music',
                icon: 'music_note'
            };
        }

        const currentSong = LocalMedia.currentSong;
        if (LocalMedia.isPlaying && currentSong) {
            return {
                title: currentSong.title,
                artist: currentSong.artist,
                source: 'Local Media',
                icon: 'library_music'
            };
        }

        return {
            title: 'No media playing',
            artist: '',
            source: 'None',
            icon: 'music_off'
        };
    };

    const update = () => {
        const track = getCurrentTrack();
        icon.label = track.icon;

        switch (MODES[currentMode]) {
            case 'TITLE':
                label.label = track.title || 'Unknown Title';
                break;
            case 'ARTIST':
                label.label = track.artist || 'Unknown Artist';
                break;
            case 'SOURCE':
                label.label = track.source;
                break;
        }
    };

    const startCycling = () => {
        if (timeout) {
            GLib.source_remove(timeout);
        }
        timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, CYCLE_INTERVAL, () => {
            currentMode = (currentMode + 1) % MODES.length;
            update();
            return true;
        });
    };

    const cycleMode = () => {
        currentMode = (currentMode + 1) % MODES.length;
        update();
        // Reset the cycle timer when manually cycling
        startCycling();
    };

    // Connect to both services
    YTMusic.connect("current-track", update);
    YTMusic.connect("playing", update);
    
    // Connect to local media service
    LocalMedia.connect('song-changed', update);
    LocalMedia.connect('status-changed', update);
    LocalMedia.connect('metadata', update);

    // Initial update and start cycling
    update();
    startCycling();

    const box = Widget.Box({
        className: "media-indicator",
        children: [
            icon,
            Widget.Box({ className: "separator-box" }),
            label,
        ],
    });

    box.cycleMode = cycleMode;
    return box;
};

export default () => Widget.Button({
    className: "media-button",
    onClicked: () => {
        const widget = Widget.getWidget("media-indicator");
        if (widget) {
            widget.cycleMode();
        }
    },
    child: MediaIndicator(),
});
