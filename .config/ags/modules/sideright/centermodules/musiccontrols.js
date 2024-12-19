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

export const getPlayer = () => {
    const players = Mpris.players;
    // Prioritize plasma-browser-integration if available
    const plasmaPlayer = players.find(p => p.busName.includes('plasma-browser-integration'));
    if (plasmaPlayer) return plasmaPlayer;
    
    // Otherwise return the first available player
    return players[0] || null;
};

function formatTime(microseconds) {
    if (!microseconds || microseconds <= 0) return '0:00';
    const seconds = Math.floor(microseconds / 1000000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

const TrackTitle = ({ player }) => Label({
    className: 'sideright-music-title',
    xalign: 0,
    justification: 'left',
    truncate: 'end',
    setup: self => self.hook(player, () => {
        if (!player) return;
        self.label = player.trackTitle || '';
        self.visible = !!player.trackTitle;
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
            const length = player.length;
            if (length > 0) {
                self.label = `${formatTime(pos)} / ${formatTime(length)}`;
                self.visible = true;
            } else {
                self.visible = false;
            }
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
    setup: self => self.hook(Mpris, () => {
        const player = getPlayer();
        self.visible = !!player;
    }),
    vertical: false,
    child: Box({
        className: 'sideright-music-box',
        vertical: true,
        children: [
            Box({
                className: 'sideright-music-info',
                children: [
                    Box({
                        vertical: true,
                        hexpand: true,
                        children: [
                            TrackTitle({ player: getPlayer() }),
                            TrackTime({ player: getPlayer() }),
                        ],
                    }),
                    Box({
                        className: 'sideright-music-controls',
                        hpack: 'end',
                        setup: self => self.hook(Mpris, () => {
                            const player = getPlayer();
                            if (!player) {
                                self.visible = false;
                                return;
                            }
                            self.visible = true;
                            self.children = [
                                ControlButton({
                                    icon: 'skip_previous',
                                    action: () => player?.previous(),
                                    sensitive: player?.canGoPrev || false,
                                }),
                                ControlButton({
                                    icon: player?.playbackStatus === 'Playing' ? 'pause' : 'play_arrow',
                                    action: () => {
                                        if (player?.playbackStatus === 'Playing') {
                                            player.pause();
                                        } else {
                                            player.play();
                                        }
                                    },
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
});
