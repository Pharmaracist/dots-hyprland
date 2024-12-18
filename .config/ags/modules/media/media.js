import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

const COVER_CACHE = new Map();
const POSITION_UPDATE_INTERVAL = 1000; // Update position every second

const formatTime = (microseconds) => {
    const seconds = Math.floor(microseconds / 1000000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const PlayerControls = () => {
    let positionBinding = null;
    
    const widget = Widget.Box({
        className: 'media-box',
        vertical: true,
        visible: false,
        connections: [[Mpris, (box) => {
            const player = Mpris.getPlayer();
            box.visible = !!player;
            
            // Set up position updates
            if (positionBinding) {
                GLib.source_remove(positionBinding);
                positionBinding = null;
            }
            
            if (player) {
                positionBinding = GLib.timeout_add(GLib.PRIORITY_DEFAULT, POSITION_UPDATE_INTERVAL, () => {
                    if (!player.closed) {
                        const position = player.position;
                        widget.emit('position-changed', position);
                        return GLib.SOURCE_CONTINUE;
                    }
                    positionBinding = null;
                    return GLib.SOURCE_REMOVE;
                });
            }
        }]],
        children: [
            Widget.Box({
                className: 'media-player',
                vertical: true,
                children: [
                    // Current track info
                    Widget.Box({
                        className: 'media-info',
                        children: [
                            Widget.Box({
                                className: 'media-art',
                                children: [
                                    Widget.Box({
                                        className: 'media-art-box',
                                        connections: [[Mpris, box => {
                                            const player = Mpris.getPlayer();
                                            const coverUrl = player?.trackCoverUrl;
                                            
                                            if (coverUrl) {
                                                if (COVER_CACHE.has(coverUrl)) {
                                                    box.css = `background-image: url('${coverUrl}');`;
                                                } else {
                                                    // Load image asynchronously
                                                    const file = Gio.File.new_for_uri(coverUrl);
                                                    file.read_async(GLib.PRIORITY_DEFAULT, null, (_, result) => {
                                                        try {
                                                            file.read_finish(result);
                                                            COVER_CACHE.set(coverUrl, true);
                                                            box.css = `background-image: url('${coverUrl}');`;
                                                        } catch (error) {
                                                            console.error('Error loading cover art:', error);
                                                            box.css = 'background-image: none;';
                                                        }
                                                    });
                                                }
                                            } else {
                                                box.css = 'background-image: none;';
                                            }
                                        }]],
                                    }),
                                ],
                            }),
                            Widget.Box({
                                className: 'media-text',
                                vertical: true,
                                children: [
                                    Widget.Label({
                                        className: 'media-title',
                                        xalign: 0,
                                        justification: 'left',
                                        truncate: 'end',
                                        connections: [[Mpris, label => {
                                            const player = Mpris.getPlayer();
                                            label.label = player?.trackTitle || '';
                                        }]],
                                    }),
                                    Widget.Label({
                                        className: 'media-artist',
                                        xalign: 0,
                                        justification: 'left',
                                        truncate: 'end',
                                        connections: [[Mpris, label => {
                                            const player = Mpris.getPlayer();
                                            label.label = player?.trackArtists?.join(', ') || '';
                                        }]],
                                    }),
                                ],
                            }),
                            Widget.Box({
                                className: 'media-download-buttons',
                                hpack: 'end',
                                hexpand: true,
                                children: [
                                    Widget.Button({
                                        className: 'download-audio',
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) {
                                                // Your download audio logic here
                                            }
                                        },
                                        child: Widget.Icon('audio-x-generic-symbolic'),
                                    }),
                                    Widget.Button({
                                        className: 'download-video',
                                        onClicked: () => {
                                            const player = Mpris.getPlayer();
                                            if (player) {
                                                // Your download video logic here
                                            }
                                        },
                                        child: Widget.Icon('video-x-generic-symbolic'),
                                    }),
                                ],
                            }),
                        ],
                    }),

                    // Controls
                    Widget.CenterBox({
                        className: 'media-controls',
                        startWidget: Widget.Label({
                            className: 'media-position txt-norm',
                            connections: [['position-changed', (label, position) => {
                                label.label = formatTime(position);
                            }]],
                        }),
                        centerWidget: Widget.Box({
                            className: 'media-buttons',
                            children: [
                                Widget.Button({
                                    className: 'media-button txt-norm icon-material',
                                    label: 'skip_previous',
                                    onClicked: () => {
                                        const player = Mpris.getPlayer();
                                        if (player?.canGoPrev) player.previous();
                                    },
                                    connections: [[Mpris, button => {
                                        const player = Mpris.getPlayer();
                                        button.visible = player?.canGoPrev || false;
                                    }]],
                                }),
                                Widget.Button({
                                    className: 'media-button txt-norm icon-material',
                                    onClicked: () => {
                                        const player = Mpris.getPlayer();
                                        if (player) {
                                            if (player.playBackStatus === 'Playing') {
                                                player.pause();
                                            } else {
                                                player.play();
                                            }
                                        }
                                    },
                                    connections: [[Mpris, button => {
                                        const player = Mpris.getPlayer();
                                        button.label = player?.playBackStatus === 'Playing' ? 'pause' : 'play_arrow';
                                    }]],
                                }),
                                Widget.Button({
                                    className: 'media-button txt-norm icon-material',
                                    label: 'skip_next',
                                    onClicked: () => {
                                        const player = Mpris.getPlayer();
                                        if (player?.canGoNext) player.next();
                                    },
                                    connections: [[Mpris, button => {
                                        const player = Mpris.getPlayer();
                                        button.visible = player?.canGoNext || false;
                                    }]],
                                }),
                            ],
                        }),
                        endWidget: Widget.Label({
                            className: 'media-length txt-norm',
                            connections: [[Mpris, label => {
                                const player = Mpris.getPlayer();
                                label.label = player ? formatTime(player.length) : '0:00';
                            }]],
                        }),
                    }),

                    // Position slider
                    Widget.Slider({
                        className: 'media-position',
                        drawValue: false,
                        onChange: ({ value }) => {
                            const player = Mpris.getPlayer();
                            if (player?.canSeek) {
                                player.position = value * player.length;
                            }
                        },
                        connections: [
                            [Mpris, slider => {
                                const player = Mpris.getPlayer();
                                if (!player?.length || !player?.canSeek) {
                                    slider.visible = false;
                                    return;
                                }
                                slider.visible = true;
                                slider.value = player.position / player.length;
                            }],
                            ['position-changed', (slider, position) => {
                                const player = Mpris.getPlayer();
                                if (player?.length) {
                                    slider.value = position / player.length;
                                }
                            }],
                        ],
                    }),
                ],
            }),
        ],
    });

    return widget;
};

export default PlayerControls;
