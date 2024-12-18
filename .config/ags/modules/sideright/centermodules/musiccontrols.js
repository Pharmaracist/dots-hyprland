const { GLib, GObject, Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import YTMusic from '../../../services/ytmusic.js';
const { Box, EventBox, Icon, Scrollable, Label, Button, Revealer } = Widget;

import {MaterialIcon}  from "../../.commonwidgets/materialicon.js";

function isRealPlayer(player) {
    return (
        !player.busName.startsWith('org.mpris.MediaPlayer2.playerctld') &&
        !(player.busName.endsWith('.mpd') && !player.busName.endsWith('MediaPlayer2.mpd'))
    );
}

export const getPlayer = () => Mpris.players[0] || null;

function formatTime(length) {
    const min = Math.floor(length / 60);
    const sec = Math.floor(length % 60);
    const sec0 = sec < 10 ? '0' : '';
    return `${min}:${sec0}${sec}`;
}

const TrackTitle = ({ player }) => Label({
    className: 'sideright-music-title',
    xalign: 0,
    justification: 'left',
    truncate: 'end',
    setup: self => self.hook(player, () => {
        if (!player) return;
        self.label = player.trackTitle || '';
    }),
});

const TrackArtists = ({ player, ...rest }) => Label({
    ...rest,
    xalign: 0,
    truncate: 'end',
    className: 'sideright-music-artists',
    setup: (self) => self.hook(player, (self) => {
        if (!player) return;
        self.label = player.trackArtists.join(', ') || '';
    }),
});

const TrackTime = ({ player, ...rest }) => Label({
    ...rest,
    xalign: 0,
    className: 'sideright-music-time',
    setup: (self) => {
        let current = 0;
        const update = () => {
            if (!player) return;
            const pos = player.position;
            current = pos;
            self.label = `${formatTime(pos)} / ${formatTime(player.length)}`;
        };
        self.hook(player, update);
        self.poll(1000, update);
    },
});

const ControlButton = ({ icon, action, sensitive = true }) => Button({
    className: 'sideright-music-pill',
    onClicked: action,
    child: MaterialIcon(icon, 'hugeass'),
    sensitive,
});

export default () => Box({
    className: 'sideright-music',
    setup: self => {
        // Update cover and visibility
        const updateCover = () => {
            const player = getPlayer();
            if (!player) {
                self.visible = false;
                return;
            }

            self.visible = true;

            // Update cover art
            const coverPath = player.coverPath;
            if (coverPath) {
                const styleContext = self.get_style_context();
                const currentCoverPath = styleContext.get_property('background-image', Gtk.StateFlags.NORMAL);
                if (!currentCoverPath || !currentCoverPath.includes(coverPath)) {
                    self.css = `
                        background-image: url('${coverPath}');
                        background-size: cover;
                        background-position: center;
                    `;
                }
            } else {
                self.css = '';
            }
        };

        // Use polling instead of hooks for more reliable updates
        self.poll(1000, updateCover);
    },
    vertical: false,
    child: Box({
        className: 'sideright-music-box',
        vertical: true,
        children: [
            Box({
                className: 'sideright-music-info',
                vertical: true,
                children: [
                    Box({
                        children: [
                            Box({
                                vertical: true,
                                children: [
                                    TrackTitle({ player: getPlayer() }),
                                    TrackTime({ player: getPlayer() }),
                                    // TrackArtists({ player: getPlayer() }),
                                ],
                            }),
                            Box({ hexpand: true }),
                            Box({
                                className: 'sideright-music-controls',
                                vexpand: false,
                                vpack: 'end',
                                setup: self => self.hook(Mpris, () => {
                                    const player = getPlayer();
                                    self.children = [
                                        ControlButton({
                                            icon: 'skip_previous',
                                            action: () => player?.previous(),
                                            sensitive: player?.canGoPrev || false,
                                        }),
                                        ControlButton({
                                            icon: player?.playBackStatus === 'Playing' ? 'pause' : 'play_arrow',
                                            action: () => player?.playBackStatus === 'Playing' ? player?.pause() : player?.play(),
                                            sensitive: player?.canPlay || false,
                                        }),
                                        ControlButton({
                                            icon: 'skip_next',
                                            action: () => player?.next(),
                                            sensitive: player?.canGoNext || false,
                                        }),
                                    ];
                                }),
                            }),
          
                        ],
                    }),
                ],
            }),
        ],
    }),
});
