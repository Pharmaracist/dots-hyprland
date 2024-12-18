const { Gtk, Gdk, GObject } = imports.gi;
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

const { Box, Button, Icon, Label, Revealer, Scrollable, Entry, Slider } = Widget;
const { execAsync } = Utils;

const CACHE_DIR = GLib.build_filenamev([GLib.get_user_cache_dir(), 'media-controls']);

// Ensure cache directory exists
if (!GLib.file_test(CACHE_DIR, GLib.FileTest.EXISTS)) {
    GLib.mkdir_with_parents(CACHE_DIR, 0o755);
}

// Styles
const buttonStyle = 'padding: 0.5em; margin: 0.3em;';
const sliderStyle = 'margin: 0.5em;';

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
            className: 'ytm-controls-box',
            vertical: true,
            children: [
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
                
                // Main Controls Row
                Box({
                    className: 'ytm-main-controls spacing-h-5 margin-rl-15',
                    hexpand: true,
                    children: [
                        // Playback Mode Controls (Shuffle/Loop)
                        Box({
                            className: 'ytm-mode-controls spacing-h-5',
                            hpack: 'center',
                            children: [
                                Button({
                                    className: 'control-button sec-txt',
                                    child: MaterialIcon(YTMusic.shuffle ? 'shuffle_on' : 'shuffle', 'larger'),
                                    onClicked: () => {
                                        YTMusic.shuffle = !YTMusic.shuffle;
                                        YTMusic._sendMpvCommand(['playlist-shuffle']);
                                        return true;
                                    },
                                    setup: button => {
                                        setupCursorHover(button);
                                        YTMusic.connect('notify::shuffle', () => {
                                            button.child.label = YTMusic.shuffle ? 'shuffle_on' : 'shuffle';
                                        });
                                    },
                                }),
                                Button({
                                    className: 'control-button sec-txt',
                                    child: MaterialIcon(YTMusic.repeat ? 'repeat_one' : 'repeat', 'larger'),
                                    onClicked: () => {
                                        YTMusic.repeat = !YTMusic.repeat;
                                        YTMusic._sendMpvCommand(['cycle-values', 'loop-file', 'inf', 'no']);
                                        return true;
                                    },
                                    setup: button => {
                                        setupCursorHover(button);
                                        YTMusic.connect('notify::repeat', () => {
                                            button.child.label = YTMusic.repeat ? 'repeat_one' : 'repeat';
                                        });
                                    },
                                }),
                            ],
                        }),
                        
                        // Center - Main Controls
                        Box({
                            className: 'ytm-playback-controls',
                            hpack: 'center',
                            hexpand: true,
                            spacing: 4,
                            children: [
                                Button({
                                    className: 'control-button sec-txt',
                                    child: MaterialIcon('skip_previous', 'larger'),
                                    onClicked: () => {
                                        YTMusic._sendMpvCommand(['playlist-prev']);
                                        return true;
                                    },
                                    setup: setupCursorHover,
                                }),
                                Box({
                                    className: 'play-button-container',
                                    setup: box => {
                                        const playButton = Button({
                                            className: 'control-button sec-txt',
                                            child: MaterialIcon(YTMusic.playing ? 'pause' : 'play_arrow', 'larger'),
                                            onClicked: () => {
                                                YTMusic.togglePlay();
                                                return true;
                                            },
                                            setup: button => {
                                                setupCursorHover(button);
                                                YTMusic.connect('notify::playing', () => {
                                                    if (!YTMusic._loading) {
                                                        button.child.label = YTMusic.playing ? 'pause' : 'play_arrow';
                                                    }
                                                });
                                            },
                                        });
                                        
                                        YTMusic.connect('notify::loading', () => {
                                            if (YTMusic._loading) {
                                                playButton.child.label = 'hourglass_empty';
                                            } else {
                                                playButton.child.label = YTMusic.playing ? 'pause' : 'play_arrow';
                                            }
                                        });
            
                                        box.children = [playButton];
                                    },
                                }),
                                Button({
                                    className: 'control-button sec-txt',
                                    child: MaterialIcon('skip_next', 'larger'),
                                    onClicked: () => {
                                        YTMusic._sendMpvCommand(['playlist-next']);
                                        return true;
                                    },
                                    setup: setupCursorHover,
                                }),
                            ],
                        }),
                        
                        // View Toggle
                        Button({
                            className: 'ytm-toggle-view-button control-button sec-txt',
                            hpack: 'end',
                            tooltipText: 'Toggle between home and downloads',
                            child: MaterialIcon('home', 'larger'),
                            onClicked: () => {
                                YTMusic.toggleDownloadedView();
                                YTMusic.search(YTMusic._currentSearchQuery);
                            },
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
                
                // Volume Control at the bottom
                VolumeControl(),
            ],
        }),
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
                    children: [
                        Box({
                            className: 'track-content',
                            children: [
                                Box({
                                    className: 'track-item-thumb',
                                    css: item.thumbnail ? 
                                        `min-width: 48px;
                                        min-height: 48px;
                                        margin: 8px;
                                        background: url("${item.thumbnail}") center/cover no-repeat;
                                        border-radius: 4px;` : 
                                        `min-width: 48px;
                                        min-height: 48px;
                                        margin: 8px;
                                        background-color: rgba(255, 255, 255, 0.1);
                                        border-radius: 4px;`,
                                }),
                                Box({
                                    className: 'track-item-info',
                                    vertical: true,
                                    hexpand: true,
                                    children: [
                                        Box({
                                            css: 'padding-right: 48px;',
                                            children: [
                                                Label({
                                                    label: item.title,
                                                    xalign: 0,
                                                    justification: 'left',
                                                    className: 'track-item-title',
                                                    wrap: true,
                                                    css: 'margin-right: 8px;',
                                                }),
                                            ],
                                        }),
                                        Label({
                                            label: item.artists.map(a => a.name).join(', '),
                                            xalign: 0,
                                            justification: 'left',
                                            className: 'track-item-artist',
                                            wrap: true,
                                            css: 'margin-right: 48px;',
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        Button({
                            className: 'control-button sec-txt',
                            css: 'margin: 8px;',
                            child: MaterialIcon(
                                item.isDownloaded ? 'download_done' :
                                YTMusic.cachingStatus[item.videoId] === 'caching' ? 'downloading' :
                                YTMusic.cachingStatus[item.videoId] === 'cached' ? 'download_done' :
                                YTMusic.cachingStatus[item.videoId] === 'error' ? 'error' :
                                'download', 
                                'larger'
                            ),
                            onClicked: () => !item.isDownloaded && YTMusic.cacheTrack(item.videoId),
                            setup: setupCursorHover,
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
    
        Scrollable({
            vexpand: true,
            child: SearchResults(),
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
    .track-item-thumb {
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
