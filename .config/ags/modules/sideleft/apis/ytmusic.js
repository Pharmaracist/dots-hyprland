const { Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import YTMusic from '../../../services/ytmusic.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import { AnimatedCircProg } from '../../.commonwidgets/cairo_circularprogress.js';
import { AnimatedSlider } from '../../.commonwidgets/cairo_slider.js';
import GLib from 'gi://GLib';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';

const { Box, Button, Icon, Label, Scrollable, Slider, Entry } = Widget;
const { execAsync } = Utils;

const CACHE_DIR = GLib.build_filenamev([GLib.get_user_cache_dir(), 'media-controls']);

// Ensure cache directory exists
if (!GLib.file_test(CACHE_DIR, GLib.FileTest.EXISTS)) {
    GLib.mkdir_with_parents(CACHE_DIR, 0o755);
}

// Volume Control with Audio Service
const VolumeControl = () => Box({
    className: 'ytm-volume-control spacing-h-10 margin-rl-15',
    setup: box => {
        box.connect('scroll-event', (widget, event) => {
            const direction = event.get_scroll_deltas()[2];
            const step = 0.02;
            const currentVolume = Audio.speaker?.volume || 0;
            let newVolume;

            if (direction < 0) {  // Scroll up
                newVolume = Math.min(1, currentVolume + step);
            } else if (direction > 0) {  // Scroll down
                newVolume = Math.max(0, currentVolume - step);
            }

            if (newVolume !== undefined && newVolume !== currentVolume) {
                Audio.speaker.volume = newVolume;
                YTMusic.setVolume(Math.round(newVolume * 100));
            }
            return true;
        });
    },
    children: [
        Icon({
            className: 'ytm-volume-icon',
            vpack: 'center',
            setup: self => {
                const update = () => {
                    const isMuted = Audio.speaker?.isMuted;
                    const volume = Audio.speaker?.volume || 0;

                    if (isMuted || volume === 0) {
                        self.icon = 'audio-volume-muted-symbolic';
                    } else if (volume < 0.3) {
                        self.icon = 'audio-volume-low-symbolic';
                    } else if (volume < 0.7) {
                        self.icon = 'audio-volume-medium-symbolic';
                    } else {
                        self.icon = 'audio-volume-high-symbolic';
                    }
                };
                Audio.connect('speaker-changed', update);
                Audio.speaker?.connect('changed', update);
                update();
            },
        }),
        Box({
            hexpand: true,
            vpack: 'center',
            vertical: true,
            className: 'spacing-v-5',
            children: [
                Slider({
                    drawValue: false,
                    hpack: 'fill',
                    className: 'sidebar-volmixer-stream-slider',
                    value: Audio.speaker?.volume || 0,
                    onChange: ({ value }) => {
                        Audio.speaker.volume = value;
                        YTMusic.setVolume(Math.round(value * 100));
                    },
                    setup: slider => {
                        const update = () => {
                            slider.value = Audio.speaker?.volume || 0;
                        };
                        Audio.connect('speaker-changed', update);
                        Audio.speaker?.connect('changed', update);
                        update();
                    },
                }),
            ],
        }),
    ],
});

// Media Controls
export const MediaControls = () => Box({
    className: 'ytm-controls',
    vertical: true,
    children: [
        // Now Playing Section
        Box({
            className: 'ytm-now-playing',
            css: 'font-size: 1rem; font-weight: 500',
            children: [
                Box({
                    className: 'sec-txt ytm-now-playing-info',
                    vertical: true,
                    hpack: 'center',
                    hexpand: true,
                    children: [
                        Label({
                            className: 'sec-txt ytm-now-playing-title',
                            justification: 'center',
                            wrap: true,
                            setup: label => {
                                label.connect('realize', () => {
                                    const update = () => {
                                        const track = YTMusic.currentTrack;
                                        const mpris = Mpris.players.find(p => p.identity === 'mpv');
                                        const title = track?.title || mpris?.trackTitle || 'Not playing';
                                        label.label = title.length > 30 ? 
                                            title.slice(0, 30) + '...' : 
                                            title;
                                    };
                                    YTMusic.connect('notify::current-track', update);
                                    Mpris.connect('player-changed', update);
                                    update();
                                });
                            },
                        }),
                        Label({
                            className: 'ytm-now-playing-artist sec-txt',
                            justification: 'center',
                            wrap: true,
                            setup: label => {
                                label.connect('realize', () => {
                                    const update = () => {
                                        const track = YTMusic.currentTrack;
                                        const mpris = Mpris.players.find(p => p.identity === 'mpv');
                                        const artists = track?.artists?.map(a => a.name).join(', ') || 
                                                       mpris?.trackArtists?.join(', ') || '';
                                        label.label = artists;
                                    };
                                    YTMusic.connect('notify::current-track', update);
                                    Mpris.connect('player-changed', update);
                                    update();
                                });
                            },
                        }),
                    ],
                }),
            ],
        }),
        
        // Controls Section
        Box({
            className: 'media-controls-box',
            hpack: 'center',
            css: `
                padding: 4px;
                margin: 8px;
            `,
            children: [
                Button({
                    className: `control-button ${YTMusic.shuffle ? 'enabled' : ''}`,
                    tooltipText: YTMusic.shuffle ? 'Shuffle Off' : 'Shuffle On',
                    onClicked: () => YTMusic.shuffle = !YTMusic.shuffle,
                    child: MaterialIcon('shuffle', YTMusic.shuffle ? 'normal colored' : 'normal'),
                    css: `
                        min-width: 28px;
                        min-height: 28px;
                        border-radius: 14px;
                        padding: 4px;
                        background-color: ${YTMusic.shuffle ? 'alpha(@accent, 0.2)' : 'alpha(@theme_fg_color, 0.1)'};
                        margin: 1px;
                    `,
                    setup: setupCursorHover,
                }),
                Box({
                    className: 'main-playback-controls',
                    hpack: 'center',
                    css: `
                        padding: 0 8px;
                        margin: 4px;
                    `,
                    children: [
                        Button({
                            className: 'control-button',
                            child: MaterialIcon('skip_previous', 'normal'),
                            onClicked: () => {
                                YTMusic._sendMpvCommand(['playlist-prev']);
                                return true;
                            },
                            css: `
                                min-width: 28px;
                                min-height: 28px;
                                border-radius: 14px;
                                padding: 4px;
                                background-color: alpha(@theme_fg_color, 0.1);
                                margin: 0 1px;
                            `,
                            setup: setupCursorHover,
                        }),
                        Button({
                            className: 'control-button primary',
                            child: MaterialIcon(YTMusic.playing ? 'pause' : 'play_arrow', 'larger'),
                            onClicked: () => {
                                YTMusic.playing ? YTMusic._sendMpvCommand(['cycle', 'pause']) : YTMusic.play();
                                return true;
                            },
                            css: `
                                min-width: 36px;
                                min-height: 36px;
                                border-radius: 18px;
                                padding: 6px;
                                background-color: @accent;
                                color: @accent_fg;
                                margin: 0 2px;
                            `,
                            setup: setupCursorHover,
                        }),
                        Button({
                            className: 'control-button',
                            child: MaterialIcon('skip_next', 'normal'),
                            onClicked: () => {
                                YTMusic._sendMpvCommand(['playlist-next']);
                                return true;
                            },
                            css: `
                                min-width: 28px;
                                min-height: 28px;
                                border-radius: 14px;
                                padding: 4px;
                                background-color: alpha(@theme_fg_color, 0.1);
                                margin: 0 1px;
                            `,
                            setup: setupCursorHover,
                        }),
                    ],
                }),
                Button({
                    className: `control-button ${YTMusic.repeat ? 'enabled' : ''}`,
                    tooltipText: YTMusic.repeat ? 'Repeat Off' : 'Repeat On',
                    onClicked: () => YTMusic.repeat = !YTMusic.repeat,
                    child: MaterialIcon('repeat', YTMusic.repeat ? 'normal colored' : 'normal'),
                    css: `
                        min-width: 28px;
                        min-height: 28px;
                        border-radius: 14px;
                        padding: 4px;
                        background-color: ${YTMusic.repeat ? 'alpha(@accent, 0.2)' : 'alpha(@theme_fg_color, 0.1)'};
                        margin: 0 1px;
                    `,
                    setup: setupCursorHover,
                }),
                Button({
                    className: 'control-button warning',
                    tooltipText: 'Stop All Instances',
                    onClicked: () => {
                        YTMusic.stopAllInstances();
                        return true;
                    },
                    child: MaterialIcon('stop_circle', 'normal'),
                    css: `
                        min-width: 28px;
                        min-height: 28px;
                        border-radius: 14px;
                        padding: 4px;
                        background-color: alpha(@error_color, 0.1);
                        color: @error_color;
                        margin: 0 1px;
                    `,
                    setup: setupCursorHover,
                }),
                Button({
                    className: 'ytm-toggle-view-button control-button',
                    tooltipText: 'Toggle between home and downloads',
                    child: MaterialIcon('home', 'normal'),
                    onClicked: () => {
                        YTMusic.toggleDownloadedView();
                        YTMusic.search(YTMusic._currentSearchQuery);
                    },
                    css: `
                        min-width: 28px;
                        min-height: 28px;
                        border-radius: 14px;
                        padding: 4px;
                        background-color: alpha(@theme_fg_color, 0.1);
                        margin: 0 1px;
                    `,
                    setup: button => {
                        setupCursorHover(button);
                        const updateIcon = () => {
                            button.child.label = YTMusic.showDownloaded ? 
                                'home' : 
                                'download_done';
                        };
                        YTMusic.connect('notify::show-downloaded', updateIcon);
                        updateIcon();
                    },
                }),
            ],
        }),
        
        // Track Progress Slider
        Box({
            className: 'ytm-seek-slider spacing-v-5 margin-rl-15',
            vertical: true,
            children: [
                Widget.Slider({
                    className: 'track-progress',
                    drawValue: false,
                    onChange: ({ value }) => {
                        if (!YTMusic.duration) return;
                        YTMusic.seek(value * YTMusic.duration);
                    },
                    setup: slider => {
                        slider.hook(YTMusic, () => {
                            if (!YTMusic.position || !YTMusic.duration) {
                                slider.visible = false;
                                return;
                            }
                            slider.visible = true;
                            slider.value = YTMusic.position / YTMusic.duration;
                        });
                    },
                }),
                Box({
                    homogeneous: true,
                    children: [
                        Label({
                            className: 'txt-smallie txt',
                            setup: label => {
                                label.hook(YTMusic, () => {
                                    label.label = formatTime(YTMusic.position || 0);
                                });
                            },
                        }),
                        Label({
                            className: 'txt-smallie txt',
                            hpack: 'end',
                            setup: label => {
                                label.hook(YTMusic, () => {
                                    label.label = formatTime(YTMusic.duration || 0);
                                });
                            },
                        }),
                    ],
                }),
            ],
        }),
        
        // Volume Control at the bottom
        VolumeControl(),
    ],
});

const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Search Results
const SearchResults = () => Box({
    className: 'ytm-results',
    vertical: true,
    setup: box => {
        const itemCache = new Map();
        
        const createTrackItem = (item) => {
            if (itemCache.has(item.videoId)) {
                return itemCache.get(item.videoId);
            }

            const trackItem = Button({
                className: 'track-item',
                onClicked: () => YTMusic.play(item.videoId),
                child: Box({
                    css: 'padding: 4px;',
                    children: [
                        Box({
                            className: 'track-content',
                            children: [
                                Box({
                                    className: 'track-item-info',
                                    vertical: true,
                                    hexpand: true,
                                    css: `
                                        padding: 4px;
                                        min-width: 200px;
                                        width: 300px;
                                    `,
                                    children: [
                                        Box({
                                            children: [
                                                Label({
                                                    label: item.title,
                                                    xalign: 0,
                                                    justification: 'left',
                                                    className: 'track-item-title',
                                                    wrap: true,
                                                    lines: 2,
                                                    ellipsize: 3,
                                                    css: `
                                                        margin: 0 8px 2px 0;
                                                        min-height: 20px;
                                                        font-size: 14px;
                                                        font-weight: bold;
                                                    `,
                                                }),
                                            ],
                                        }),
                                        Label({
                                            label: item.artists.map(a => a.name).join(', '),
                                            xalign: 0,
                                            justification: 'left',
                                            className: 'track-item-artist',
                                            wrap: true,
                                            lines: 1,
                                            ellipsize: 3,
                                            css: `
                                                margin: 2px 8px 0 0;
                                                min-height: 16px;
                                                font-size: 12px;
                                                opacity: 0.8;
                                            `,
                                        }),
                                    ],
                                }),
                                Button({
                                    className: 'control-button sec-txt download-button',
                                    css: `
                                        margin: 2px;
                                        padding: 4px;
                                        min-width: 32px;
                                        min-height: 32px;
                                        border-radius: 6px;
                                        transition: all 200ms ease;
                                        background-color: rgba(255, 255, 255, 0.1);
                                    `,
                                    child: Box({
                                        homogeneous: true,
                                        child: MaterialIcon(
                                            item.isDownloaded ? 'download_done' :
                                            YTMusic.cachingStatus[item.videoId] === 'caching' ? 'downloading' :
                                            YTMusic.cachingStatus[item.videoId] === 'cached' ? 'download_done' :
                                            YTMusic.cachingStatus[item.videoId] === 'error' ? 'error' :
                                            'download', 
                                            'normal'
                                        ),
                                    }),
                                    onClicked: () => !item.isDownloaded && YTMusic.cacheTrack(item.videoId),
                                    tooltipText: item.isDownloaded ? 'Already downloaded' :
                                               YTMusic.cachingStatus[item.videoId] === 'caching' ? 'Downloading...' :
                                               YTMusic.cachingStatus[item.videoId] === 'cached' ? 'Downloaded' :
                                               YTMusic.cachingStatus[item.videoId] === 'error' ? 'Download failed' :
                                               'Download track',
                                    setup: button => {
                                        setupCursorHover(button);
                                        
                                        // Add visual feedback for download states
                                        const updateStyle = () => {
                                            const status = YTMusic.cachingStatus[item.videoId];
                                            let bgColor = 'rgba(255, 255, 255, 0.1)'; // default
                                            let hoverColor = 'rgba(255, 255, 255, 0.2)';
                                            
                                            if (status === 'caching') {
                                                bgColor = 'rgba(255, 196, 0, 0.2)';
                                                hoverColor = 'rgba(255, 196, 0, 0.3)';
                                            } else if (status === 'cached' || item.isDownloaded) {
                                                bgColor = 'rgba(0, 255, 0, 0.2)';
                                                hoverColor = 'rgba(0, 255, 0, 0.3)';
                                            } else if (status === 'error') {
                                                bgColor = 'rgba(255, 0, 0, 0.2)';
                                                hoverColor = 'rgba(255, 0, 0, 0.3)';
                                            }
                                            
                                            button.className = `control-button sec-txt download-button ${status || ''}`;
                                            button.css = `
                                                margin: 2px;
                                                padding: 4px;
                                                min-width: 32px;
                                                min-height: 32px;
                                                border-radius: 6px;
                                                transition: all 200ms ease;
                                                background-color: ${bgColor};
                                            `;

                                            // Add hover styles through a stylesheet
                                            const provider = new Gtk.CssProvider();
                                            const css = `.download-button.${status || ''}:hover {
                                                background-color: ${hoverColor};
                                                opacity: 0.9;
                                            }`;
                                            provider.load_from_data(css);
                                            button.get_style_context().add_provider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
                                        };
                                        
                                        YTMusic.connect('notify::caching-status', updateStyle);
                                        updateStyle();
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
        });

            itemCache.set(item.videoId, trackItem);
            return trackItem;
        };

        const noResultsView = Box({
            vertical: true,
            className: 'ytm-no-results sec-txt',
            css:"margin-top :1rem",
            children: [
                MaterialIcon('library_music', 'hugeass'),
                Label({
                    label: 'No results',
                    className: 'title',
                }),
            ],
        });

        const update = () => {
            const results = YTMusic.searchResults;
            if (!results?.length) {
                noResultsView.children[1].label = YTMusic.showDownloaded ? 
                    'No downloaded songs found' : 
                    'Search for music on YouTube';
                box.children = [noResultsView];
                return;
            }

            // Clear cache of old items
            const currentIds = new Set(results.map(item => item.videoId));
            for (const [id] of itemCache) {
                if (!currentIds.has(id)) {
                    itemCache.delete(id);
                }
            }

            box.children = results.map(createTrackItem);
        };

        YTMusic.connect('notify::search-results', update);
        YTMusic.connect('notify::show-downloaded', update);
        YTMusic.connect('notify::caching-status', () => {
            // Only update if we have items
            if (box.children.length > 1) {
                update();
            }
        });
        update();
    },
});

// Export the view
export const ytmusicView = Box({
    className: 'ytmusic-view',
    vertical: true,
    children: [
        Box({
            vertical: true,
            children: [
                Scrollable({
                    vexpand: true,
                    child: SearchResults(),
                }),
            ],
        }),
        Widget.Box({
            children: [
                MediaControls(),
            ],
        }),
    ],
});

// Send message function for the API
export const sendMessage = (text) => {
    if (!text) return;
    YTMusic.search(text).catch(console.error);
};

// Export the commands
export const ytmusicCommands = Box({
    className: 'commands-box',
});

// Export the icon
export const ytmusicTabIcon = Box({
    className: 'txt-norm',
    child: MaterialIcon('music_note', 'large'),
});

// Add styles

App.connect('config-parsed', () => {
    App.stylesheet += `
    .ytm-controls {
        padding: 0.5em;
    }
    .ytm-controls-box {
        padding: 0.5em;
    }
    .ytm-main-controls {
        padding: 0.5em;
    }
    .ytm-playback-controls {
        padding: 0.5em;
    }
    .ytm-toggle-view-button {
        padding: 0.5em;
    }
    .ytm-volume-control {
        padding: 0.5em;
    }
    .ytm-volume-icon {
        padding: 0.5em;
    }
    .ytm-seek-slider {
        padding: 0.5em;
    }
    .ytm-mode-controls {
        padding: 0.5em;
    }
    .ytm-now-playing {
        padding: 0.5em;
    }
    .ytm-now-playing-info {
        padding: 0.5em;
    }
    .ytm-now-playing-title {
        padding: 0.5em;
    }
    .ytm-now-playing-artist {
        padding: 0.5em;
    }
    .ytm-results {
        padding: 0.5em;
    }
    .track-item {
        padding: 0.5em;
    }
    .track-content {
        padding: 0.5em;
    }
    .track-item-info {
        padding: 0.5em;
    }
    .track-item-title {
        padding: 0.5em;
    }
    .track-item-artist {
        padding: 0.5em;
    }
    `;
});
