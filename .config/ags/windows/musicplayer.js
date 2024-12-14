import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Gtk from 'gi://Gtk';
import { execAsync } from 'resource:///com/github/Aylur/ags/utils.js';
import mpris from '../services/mpris.js';
import cava from '../services/cava.js';

// Utility functions
const truncateText = (text, length) => {
    return text.length > length ? text.substring(0, length - 3) + '...' : text;
};

// Media controls
const MediaControls = () => Widget.Box({
    class_name: 'media-controls',
    spacing: 8,
    children: [
        Widget.Button({
            class_name: 'media-button shuffle',
            on_clicked: () => mpris.shuffle(),
            child: Widget.Icon('media-playlist-shuffle-symbolic'),
            setup: self => self.hook(mpris, (self) => {
                self.toggleClassName('active', mpris.trackInfo.shuffle);
            }),
        }),
        Widget.Button({
            class_name: 'media-button previous',
            on_clicked: () => mpris.previous(),
            child: Widget.Icon('media-skip-backward-symbolic'),
            sensitive: mpris.trackInfo.canGoPrev,
            setup: self => self.hook(mpris, (self) => {
                self.sensitive = mpris.trackInfo.canGoPrev;
            }),
        }),
        Widget.Button({
            class_name: 'media-button play',
            on_clicked: () => mpris.playPause(),
            child: Widget.Icon({
                setup: self => self.hook(mpris, (self) => {
                    self.icon = mpris.player?.playBackStatus === 'Playing' 
                        ? 'media-playback-pause-symbolic'
                        : 'media-playback-start-symbolic';
                }),
            }),
        }),
        Widget.Button({
            class_name: 'media-button next',
            on_clicked: () => mpris.next(),
            child: Widget.Icon('media-skip-forward-symbolic'),
            sensitive: mpris.trackInfo.canGoNext,
            setup: self => self.hook(mpris, (self) => {
                self.sensitive = mpris.trackInfo.canGoNext;
            }),
        }),
        Widget.Button({
            class_name: 'media-button loop',
            on_clicked: () => {
                const status = mpris.trackInfo.loopStatus;
                mpris.setLoopStatus(status === 'None' ? 'Track' : 
                    status === 'Track' ? 'Playlist' : 'None');
            },
            child: Widget.Icon({
                setup: self => self.hook(mpris, (self) => {
                    const status = mpris.trackInfo.loopStatus;
                    self.icon = status === 'Track' ? 'media-playlist-repeat-song-symbolic' :
                        status === 'Playlist' ? 'media-playlist-repeat-symbolic' :
                        'media-playlist-consecutive-symbolic';
                }),
            }),
        }),
    ],
});

// Progress bar
const ProgressBar = () => Widget.Box({
    class_name: 'progress-bar-box',
    vertical: true,
    children: [
        Widget.Slider({
            class_name: 'progress-bar',
            draw_value: false,
            on_change: ({ value }) => mpris.seek(value),
            setup: self => {
                self.hook(mpris, (self) => {
                    const { length } = mpris.trackInfo;
                    self.adjustment.upper = length;
                });
                
                self.poll(1000, self => {
                    if (!mpris.player) return;
                    self.value = mpris.position;
                });
            },
        }),
        Widget.Box({
            class_name: 'progress-labels',
            children: [
                Widget.Label({
                    setup: self => self.poll(1000, self => {
                        const time = mpris.position;
                        const min = Math.floor(time / 60);
                        const sec = Math.floor(time % 60);
                        self.label = `${min}:${sec.toString().padStart(2, '0')}`;
                    }),
                }),
                Widget.Label({
                    setup: self => self.hook(mpris, self => {
                        const time = mpris.trackInfo.length;
                        const min = Math.floor(time / 60);
                        const sec = Math.floor(time % 60);
                        self.label = `${min}:${sec.toString().padStart(2, '0')}`;
                    }),
                }),
            ],
        }),
    ],
});

// Album art and track info
const TrackInfo = () => Widget.Box({
    class_name: 'track-info',
    spacing: 8,
    children: [
        Widget.Box({
            class_name: 'album-art',
            css: 'min-width: 100px; min-height: 100px;',
            child: Widget.Overlay({
                child: Widget.Box({
                    css: 'min-width: 100px; min-height: 100px; background-color: #111;',
                }),
                overlays: [
                    Widget.Icon({
                        class_name: 'album-art-icon',
                        icon: 'audio-x-generic-symbolic',
                        size: 48,
                        setup: self => self.hook(mpris, self => {
                            self.visible = !mpris.trackInfo.artUrl;
                        }),
                    }),
                    Widget.Box({
                        class_name: 'album-art-box',
                        css: `
                            background-image: url("${mpris.trackInfo.artUrl}");
                            background-size: cover;
                            background-position: center;
                        `,
                        setup: self => self.hook(mpris, self => {
                            self.css = `
                                background-image: url("${mpris.trackInfo.artUrl}");
                                background-size: cover;
                                background-position: center;
                            `;
                        }),
                    }),
                ],
            }),
        }),
        Widget.Box({
            vertical: true,
            vpack: 'center',
            children: [
                Widget.Label({
                    class_name: 'track-title',
                    xalign: 0,
                    justify: Gtk.Justification.LEFT,
                    setup: self => self.hook(mpris, self => {
                        self.label = truncateText(mpris.trackInfo.title || 'Not Playing', 30);
                    }),
                }),
                Widget.Label({
                    class_name: 'track-artist',
                    xalign: 0,
                    justify: Gtk.Justification.LEFT,
                    setup: self => self.hook(mpris, self => {
                        self.label = truncateText(mpris.trackInfo.artist || 'Unknown Artist', 30);
                    }),
                }),
                Widget.Label({
                    class_name: 'track-album',
                    xalign: 0,
                    justify: Gtk.Justification.LEFT,
                    setup: self => self.hook(mpris, self => {
                        self.label = truncateText(mpris.trackInfo.album || 'Unknown Album', 30);
                    }),
                }),
            ],
        }),
    ],
});

// Visualizer
const Visualizer = () => Widget.Box({
    class_name: 'music-visualizer',
    child: Widget.Box({
        class_name: 'cava-visualizer',
        spacing: 3,
        setup: self => {
            let prevHeights = [];
            const smoothingFactor = 0.3; // Adjust for more/less smoothing

            self.poll(33, () => { // Increased polling rate for smoother animation
                if (!cava.output) return;
                
                const chars = cava.output.split('');
                const currentHeights = chars.map(char => char.charCodeAt(0) - 9601);
                const maxHeight = Math.max(...currentHeights);
                
                // Initialize prevHeights if needed
                if (prevHeights.length === 0) {
                    prevHeights = [...currentHeights];
                }
                
                // Apply smoothing and create bars
                self.children = currentHeights.map((height, i) => {
                    // Smooth the height transition
                    prevHeights[i] = prevHeights[i] + (height - prevHeights[i]) * smoothingFactor;
                    const smoothHeight = prevHeights[i];
                    
                    // Calculate intensity for styling
                    const intensity = smoothHeight / maxHeight;
                    const isHigh = intensity > 0.7;
                    
                    return Widget.Box({
                        class_name: `cava-bar ${isHigh ? 'high' : 'low'}`,
                        css: `min-height: ${Math.max(1, smoothHeight * 2.5)}px;`,
                    });
                });
                
                return true;
            });
        },
    }),
});

// Main window
export default () => Widget.Window({
    name: 'music-player',
    class_name: 'music-player',
    anchor: ['top', 'bottom', 'right'],
    child: Widget.Box({
        class_name: 'music-player-box',
        vertical: true,
        children: [
            TrackInfo(),
            Visualizer(),
            ProgressBar(),
            MediaControls(),
        ],
    }),
});
