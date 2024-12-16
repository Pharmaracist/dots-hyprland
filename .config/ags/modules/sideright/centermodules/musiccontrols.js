const { GLib, GObject } = imports.gi;
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
        const updateCover = () => {
            const player = Mpris.players[0];
            if (!player) {
                self.css = 'min-height: 8rem;';
                return;
            }

            // Try to get cover from YTMusic first if it's our player
            let coverUrl = null;
            if (player.identity === 'mpv' && YTMusic.currentTrack?.thumbnail) {
                coverUrl = YTMusic.currentTrack.thumbnail;
            }

            // Fallback to MPRIS cover if no YTMusic thumbnail
            if (!coverUrl) {
                coverUrl = player.trackCoverUrl;
            }

            if (!coverUrl) {
                self.css = 'min-height: 8rem;';
            } else {
                self.css = `
                    min-height: 8rem;
                    background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.8)), url('${coverUrl}');
                    background-size: cover;
                    background-position: center;
                `;
            }
        };

        // Use polling instead of hooks for more reliable updates
        self.poll(1000, updateCover);
    },
    vertical: false,
    spacing: 4,
    children: [
        Box({
            vertical: true,
            hexpand: true,
            className: 'sideright-music-info txt-large',
            children: [
                Box({
                    vertical: true,
                    spacing: 0,
                    children: [
                        TrackTitle({ player: Mpris.players[0] }),
                        TrackArtists({ player: Mpris.players[0] }),
                    ]
                }),
                TrackTime({ player: Mpris.players[0] }),
            ]
        }),
        Box({
            className: 'sideright-music-controls',
            hpack: 'center',
            vpack: 'center',
            css: "padding-left:1rem",
            setup: self => self.hook(Mpris, () => {
                const player = Mpris.players[0];
                self.children = [
                    ControlButton({
                        icon: 'skip_previous',
                        action: () => player?.previous(),
                        sensitive: player?.canGoPrev || false,
                    }),
                    ControlButton({
                        icon: player?.playBackStatus === 'Playing' ? 'pause' : 'play_arrow',
                        action: () => player?.playPause(),
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
});
