import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import cava from "../../services/cava.js";
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GLib from 'gi://GLib';
import { AnimatedCircProg } from "../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";

const COVER_FALLBACK = 'media-optical-symbolic';
const getPlayer = () => {
    const players = Mpris.players;
    const activePlayer = players.find(p => p.trackTitle);
    return activePlayer || Mpris.getPlayer('');
};

const TRANSITION_DURATION = 50;

const AppIcon = () => Widget.Icon({
    className: 'app-icon',
    size: 40,
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
        initFrom: defaultVolume * 100,
        initTo: defaultVolume * 100,
        initAnimTime: 200,
        initAnimPoints: 10,
    });
    
    const volumeLabel = Widget.Label({
        className: 'volume-label txt-norm onSurfaceVariant',
        label: `${Math.round(defaultVolume * 100)}`,
    });
    
    const updateVolume = () => {
        const player = getPlayer();
        if (!player) return;
        const volume = Math.round(player.volume * 100);
        volumeLabel.label = `${volume}`;
        volumeCircProg.css = `font-size: ${volume}px; transition: 200ms linear;`;
    };

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
                        Widget.Box({
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
                    ],
                    setup: self => {
                        self.hook(Mpris, updateVolume);
                        updateVolume();
                    },
                }),
            }),
        ],
    });
};

const MediaControls = () => {
    const playIcon = Widget.Label({
        className: 'icon-material',
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
                    className: 'icon-material',
                    label: 'shuffle',
                }),
                onClicked: self => {
                    const player = getPlayer();
                    if (!player) return;
                    player.shuffle = !player.shuffle;
                    // Update icon immediately
                    self.child.label = player.shuffle ? 'shuffle_on' : 'shuffle';
                    self.toggleClassName('active', player.shuffle);
                },
                setup: self => self.hook(Mpris, () => {
                    const player = getPlayer();
                    if (!player) return;
                    self.toggleClassName('active', player.shuffle);
                    self.child.label = player.shuffle ? 'shuffle_on' : 'shuffle';
                }),
            }),
            Widget.Button({
                className: 'control-button',
                child: Widget.Label({
                    className: 'icon-material ',
                    label: 'skip_previous',
                }),
                onClicked: () => {
                    const player = getPlayer();
                    if (!player) return;
                    player.previous();
                },
            }),
            Widget.Button({
                className: 'play-button control-button',
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
                    
                    // Simple cycle through states
                    switch (player.loopStatus) {
                        case 'None':
                            player.loopStatus = 'Playlist';
                            break;
                        case 'Playlist':
                            player.loopStatus = 'Track';
                            break;
                        case 'Track':
                        default:
                            player.loopStatus = 'None';
                            break;
                    }
                },
                setup: button => {
                    button.hook(Mpris, () => {
                        const player = getPlayer();
                        if (!player) return;
                        
                        // Update icon based on status
                        const label = button.child;
                        if (player.loopStatus === 'Track') {
                            label.label = 'repeat_one';
                        } else if (player.loopStatus === 'Playlist') {
                            label.label = 'repeat_on';
                        } else {
                            label.label = 'repeat';
                        }
                        
                        // Update active state
                        button.toggleClassName('active', player.loopStatus !== 'None');
                    });
                },
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

const CoverArt = () => {
    const box = Widget.Box({
        className: 'cover-art',
        css: `
            min-width: 160px;
            min-height: 160px;
            background-image: url('${COVER_FALLBACK}');
            background-size: cover;
            background-position: center;
            border-radius: 18px;
            padding: 0 1.6rem;
                margin:1rem 3rem  1rem 0;
        `,
    });

    box.hook(Mpris, self => {
        const player = getPlayer();
        const coverPath = player?.cover_path;
        const isPlaying = player?.playbackStatus === 'Playing';
        
        // Hide if no player or no cover
        self.visible = !!(player && (isPlaying || coverPath));
        
        if (coverPath) {
            self.css = `
                min-width: 160px;
                min-height: 160px;
                background-image: url('${coverPath}');
                background-size: cover;
                background-position: center;
                border-radius: 18px;
                padding: 0 1.6rem;
                margin:1rem 3rem  1rem 0;
            `;
        } else {
            self.css = `
                min-width: 160px;
                min-height: 160px;
                background-image: url('${COVER_FALLBACK}');
                background-size: cover;
                background-position: center;
                border-radius: 18px;
                padding: 0 1.6rem;
                margin:1rem 3rem  1rem 0;
            `;
        }
    });

    return box;
};

// Format time in seconds to M:SS or H:MM:SS
function formatTime(seconds) {
    if (seconds <= 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const DurationBar = () => {
    const progressBar = Widget.Slider({
        className: 'duration-progress',
        drawValue: false,
        min: 0,
        max: 1,
        value: 0,
    });

    const totalTimeLabel = Widget.Label({
        className: 'duration-text',
        label: '0:00',
    });

    const currentTimeLabel = Widget.Label({
        className: 'duration-text',
        label: '0:00',
    });

    const box = Widget.Box({
        className: 'duration-bar',
        vertical: false,
        children: [
            Widget.Box({
                css: 'margin-right:2px',
                children: [currentTimeLabel],
            }),
            Widget.Box({
                className: 'duration-bar-container',
                hexpand: true,
                children: [progressBar],
            }),
            Widget.Box({
                css: 'margin-right:2px',
                children: [totalTimeLabel],
            }),
        ],
    });

    // Handle slider change
    progressBar.connect('change-value', (_, value) => {
        const player = getPlayer();
        if (!player || !player.canSeek) return;
        
        try {
            const metadata = player.metadata;
            const length = metadata['mpris:length'] || 0;
            const currentPosition = Math.floor(player.position * 1000000); // Convert to microseconds
            
            if (length > 0) {
                const targetMicroseconds = Math.floor(value * length);
                const offset = targetMicroseconds - currentPosition;
                
                console.log('Seeking:', {
                    current: currentPosition,
                    target: targetMicroseconds,
                    offset: offset
                });

                // Use GDBus directly
                Utils.execAsync([
                    'gdbus',
                    'call',
                    '--session',
                    '--dest', player.busName,
                    '--object-path', '/org/mpris/MediaPlayer2',
                    '--method', 'org.mpris.MediaPlayer2.Player.Seek',
                    offset.toString()
                ]).catch(e => console.error('Seek error:', e));
            }
        } catch (e) {
            console.error('Error seeking:', e);
        }
    });

    // Update timer
    const updateTimer = () => {
        const player = getPlayer();
        if (!player) {
            totalTimeLabel.label = '0:00';
            currentTimeLabel.label = '0:00';
            progressBar.value = 0;
            return;
        }

        try {
            const metadata = player.metadata;
            const length = metadata['mpris:length'] || 0;
            const position = Math.floor(player.position * 1000000); // Convert seconds to microseconds

            if (length > 0) {
                const lengthSec = Math.floor(length / 1000000);
                const positionSec = Math.floor(position / 1000000);
                const progress = position / length;

                progressBar.value = progress;
                totalTimeLabel.label = formatTime(lengthSec);
                currentTimeLabel.label = formatTime(positionSec);
            }
        } catch (e) {
            console.error('Error updating duration:', e);
        }
    };

    // Update on player changes
    box.hook(Mpris, (_, player) => {
        updateTimer();
    });

    // Regular updates while playing
    Utils.interval(1000, () => {
        if (box.is_destroyed) return false;
        const player = getPlayer();
        if (player?.playBackStatus === 'Playing') {
            updateTimer();
        }
        return true;
    });

    // Initial update
    Utils.timeout(100, updateTimer);

    return box;
};

export default () => Widget.Box({
    className: 'ipod-widget',
    css: 'min-height: 260px;',
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
                                    children: [CoverArt()],
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
                                            vertical: true,
                                            children: [
                                                DurationBar(),
                                                MediaControls(),
                                            ],
                                        }),
                                    ],
                                }),
                                Widget.Box({
                                    vpack: 'start', 
                                    className: 'app-icon-volume-container',
                                    children:[ 
                                        // AppIcon(),
                                        VolumeIndicator(),
                                    ] 
                                }),
                            ]
                        }),
                    ],
                }),
            ],
        }),
    ],
});
