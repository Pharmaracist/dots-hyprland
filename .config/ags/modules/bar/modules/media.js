import Widget from "resource:///com/github/Aylur/ags/widget.js";
import GLib from "gi://GLib";
import LocalMedia from "../../../services/media.js";
import YTMusic from "../../../services/ytmusic.js";
import Mpris from "../../../services/mpris.js";

const CYCLE_INTERVAL = 5000; // 5 seconds
const MODES = ['TITLE', 'ARTIST', 'SOURCE'];

const MediaIndicator = () => {
    const widget = Widget.Box({
        className: 'bar-media-indicator',
        children: [
            Widget.Icon({
                icon: 'audio-x-generic-symbolic',
                size: 16,
            }),
            Widget.Label({
                className: 'bar-media-title',
            }),
        ],
    });

    const updateWidget = () => {
        const player = Mpris.getPlayer();
        if (!player) {
            widget.visible = false;
            return;
        }

        widget.visible = true;
        const title = player.trackTitle || '';
        const artist = player.trackArtists?.join(', ') || '';
        widget.children[1].label = artist ? `${title} - ${artist}` : title;
    };

    Mpris.connect('player-added', updateWidget);
    Mpris.connect('player-removed', updateWidget);
    Mpris.connect('player-changed', updateWidget);

    updateWidget();
    return widget;
};

export default () => Widget.Button({
    className: "media-button",
    onClicked: () => {
        const widget = Widget.getWidget("media-indicator");
        if (widget) {
            // Removed cycleMode call as it's not defined in the new MediaIndicator
        }
    },
    child: MediaIndicator(),
});
