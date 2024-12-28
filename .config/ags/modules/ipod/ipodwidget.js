import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import { AnimatedCircProg } from "../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import cava from "../../services/cava.js";

const COVER_FALLBACK = 'media-optical-symbolic';
const getPlayer = () => Mpris.getPlayer('');
const TRANSITION_DURATION = 50;

const AppIcon = () => Widget.Icon({
    className: 'app-icon',
    size: 48,
}).hook(Mpris, self => {
    const player = getPlayer();
    if (!player) return;
    
    const name = player.name || '';
    const identity = player.identity || '';
    const busName = player.busName || '';
    
    // Try to find an app-specific icon
    const possibleIcons = [
        name.toLowerCase(),
        identity.toLowerCase(),
        busName.split('.')[3]?.toLowerCase(),
        'multimedia-player',
    ];
    
    for (const icon of possibleIcons) {
        if (icon) {
            self.icon = icon;
            break;
        }
    }
});

const VolumeIndicator = () => {
    const player = getPlayer();
    const defaultVolume = player?.volume || 0;
    const VOLUME_STEP = 0.02; // 2% per scroll
    
    const volumeCircProg = AnimatedCircProg({
        className: 'volume-progress',
        vpack: 'center',
        hpack: 'center',
    });
    
    const volumeLabel = Widget.Label({
        className: 'volume-label',
        label: `${Math.round(defaultVolume * 100)}`,
    });
    
    volumeLabel.hook(Mpris, () => {
        const player = getPlayer();
        if (!player) return;
        volumeLabel.label = `${Math.round(player.volume * 100)}`;
    });
    
    volumeCircProg.hook(Mpris, () => {
        const player = getPlayer();
        if (!player) return;
        volumeCircProg.css = `font-size: ${player.volume * 100}px;`;
    });
    
    return Widget.Box({
        className: 'volume-indicator',
        children: [
            Widget.EventBox({
                onScrollUp: () => {
                    const player = getPlayer();
                    if (!player) return;
                    const newVolume = Math.min(1, player.volume + VOLUME_STEP);
                    player.volume = newVolume;
                },
                onScrollDown: () => {
                    const player = getPlayer();
                    if (!player) return;
                    const newVolume = Math.max(0, player.volume - VOLUME_STEP);
                    player.volume = newVolume;
                },
                child: Widget.Box({
                    className: 'volume-container',
                    homogeneous: true,
                    children: [
                        Widget.Overlay({
                            child: Widget.Box({
                                vpack: 'center',
                                homogeneous: true,
                                children: [volumeLabel],
                            }),
                            overlays: [volumeCircProg],
                        }),
                    ],
                }),
            }),
        ],
    });
};

const MediaControls = () => {
    const playIcon = Widget.Label({
        className: 'icon-material txt-2rem',
        label: 'play_arrow',
    });

    playIcon.hook(Mpris, () => {
        const mpris = Mpris.getPlayer('');
        playIcon.label = mpris?.playBackStatus === 'Playing' ? 'pause' : 'play_arrow';
    });

    return Widget.Box({
        className: 'control-buttons',
        spacing: 2,
        children: [
            Widget.Button({
                className: 'control-button',
                child: Widget.Label({
                    className: 'icon-material txt-2rem',
                    label: 'shuffle',
                }),
                onClicked: () => {
                    const player = getPlayer();
                    if (!player) return;
                    player.shuffle = !player.shuffle;
                },
                setup: self => self.hook(Mpris, () => {
                    const player = getPlayer();
                    if (!player) return;
                    self.toggleClassName('active', player.shuffle);
                }),
            }),
            Widget.Button({
                className: 'control-button',
                child: Widget.Label({
                    className: 'icon-material txt-2rem',
                    label: 'skip_previous',
                }),
                onClicked: () => {
                    const player = getPlayer();
                    if (!player) return;
                    player.previous();
                },
            }),
            Widget.Button({
                className: 'control-button',
                child: playIcon,
                onClicked: () => {
                    const player = getPlayer();
                    if (!player) return;
                    player.playPause();
                },
                setup: self => self.hook(Mpris, () => {
                    const player = getPlayer();
                    if (!player) return;
                    self.toggleClassName('playing', player.playBackStatus === 'Playing');
                }),
            }),
            Widget.Button({
                className: 'control-button',
                child: Widget.Label({
                    className: 'icon-material txt-2rem',
                    label: 'skip_next',
                }),
                onClicked: () => {
                    const player = getPlayer();
                    if (!player) return;
                    player.next();
                },
            }),
            Widget.Button({
                className: 'control-button',
                child: Widget.Label({
                    className: 'icon-material txt-2rem',
                    label: 'repeat',
                }),
                onClicked: () => {
                    const player = getPlayer();
                    if (!player) return;
                    if (player.loopStatus === 'None') player.loopStatus = 'Playlist';
                    else if (player.loopStatus === 'Playlist') player.loopStatus = 'Track';
                    else player.loopStatus = 'None';
                },
                setup: self => self.hook(Mpris, () => {
                    const player = getPlayer();
                    if (!player) return;
                    self.child.label = player.loopStatus === 'Track' ? 'repeat_one' : 'repeat';
                    self.toggleClassName('active', player.loopStatus !== 'None');
                }),
            }),
        ],
    });
};

const TrackLabels = () => {
    const label = (className, type) => Widget.Label({
        className,
        xalign: 0,
        truncate: 'end',
        maxWidthChars: 100,
    }).hook(Mpris, self => {
        const player = getPlayer();
        self.label = type === 'title'
            ? player?.track_title || 'Not Playing'
            : player?.track_artists.join(', ') || 'No Artist';
    });

    return Widget.Box({
        vertical: true,
        vpack: 'center',
        hexpand: true,
        children: [
            label('track-title', 'title'),
            label('track-artist', 'artist'),
        ],
    });
};

const CavaVisualizer = () => {
    const visualizer = Widget.Box({
        className: 'cava-visualizer',
        spacing: 2,
        hpack: 'center',
        vpack: 'end',
        hexpand: true,
    });

    // Create a fixed set of labels that we'll reuse
    const numBars = 73; // Exact number of bars
    const bars = Array(numBars).fill(0).map(() => Widget.Label({
        label: '▁',
        className: 'cava-bar',
        hpack: 'center',
        hexpand: true,
        css: `
            margin: 0 0.5px;
            font-size: 2.1em;
            background-color: transparent;
            padding: 0 2px;
        `
    }));
    visualizer.children = bars;

    const updateVisualizer = () => {
        const output = cava.output;
        if (!output) {
            // If no output, reset all bars to base state
            bars.forEach(bar => {
                bar.label = '▁';
                bar.className = 'cava-bar';
            });
            return;
        }

        const chars = output.split('');
        // Ensure we only process the exact number of bars we have
        const len = Math.min(chars.length, numBars);
        
        for (let i = 0; i < numBars; i++) {
            const bar = bars[i];
            if (i < len) {
                const char = chars[i];
                const height = char.charCodeAt(0) - 9601;
                const maxHeight = 7;
                let className = 'cava-bar';
                
                if (height > maxHeight * 0.7) className += ' cava-bar-high';
                else if (height > maxHeight * 0.4) className += ' cava-bar-med';
                else className += ' cava-bar-low';
                
                bar.className = className;
                bar.label = char;
            } else {
                // Reset any remaining bars
                bar.label = '▁';
                bar.className = 'cava-bar';
            }
        }
    };

    visualizer.hook(cava, updateVisualizer, 'output-changed');
    return visualizer;
};

export default () => Widget.Box({
    className: 'ipod-widget',
    css: 'min-height: 240px;',
    children: [
        Widget.Box({
            className: 'ipod-content',
            children: [
                Widget.Overlay({
                    child: Widget.Box({
                        className: 'cava-container',
                        children: [CavaVisualizer()],
                    }),
                    overlays: [
                        Widget.Box({
                            children: [
                                Widget.Box({
                                    className: 'left-section',
                                    children: [
                                        Widget.Box({
                                            className: 'cover-art',
                                            css: `
                                                min-width: 180px;
                                                min-height: 180px;
                                                background-image: url('${COVER_FALLBACK}');
                                                background-size: cover;
                                                background-position: center;
                                                border-radius: 14px;
                                                padding: 0 1.5rem;
                                            `,
                                        }).hook(Mpris, self => {
                                            const coverPath = getPlayer()?.cover_path;
                                            if (coverPath) {
                                                self.css = `
                                                    min-width: 180px;
                                                    min-height: 180px;
                                                    background-image: url('${coverPath}');
                                                    background-size: cover;
                                                    background-position: center;
                                                    border-radius: 14px;
                                                    padding: 0 1.5rem;
                                                `;
                                            } else {
                                                self.css = `
                                                    min-width: 180px;
                                                    min-height: 180px;
                                                    background-image: url('${COVER_FALLBACK}');
                                                    background-size: cover;
                                                    background-position: center;
                                                    border-radius: 14px;
                                                    padding: 0 2rem;
                                                `;
                                            }
                                        }),
                                    ],
                                }),
                                Widget.Box({
                                    className: 'volume-indicator-container',
                                    vpack: 'center',
                                    vertical: true,
                                    children: [
                                        TrackLabels(),
                                        Widget.Box({hexpand: true}),
                                        Widget.Box({
                                            className: 'right-section',
                                            vpack: 'end',
                                            hpack: 'start',
                                            hexpand: true,
                                            children: [
                                                MediaControls(),
                                            ],
                                        }),
                                    ],
                                }),
                                Widget.Box({
                                    vpack: 'start', 
                                    className: 'app-icon-volume-container',
                                    children:[ 
                                        AppIcon(),
                                        VolumeIndicator(),
                                    ] 
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
    ],
});
