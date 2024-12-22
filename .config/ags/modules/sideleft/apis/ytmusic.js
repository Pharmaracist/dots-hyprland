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
    children: [
        // Now Playing Section
        // Box({
                // children: [
                Box({
                    className: ' ytm-now-playing-info',
                    children: [
                        Box({
                            className: 'now-playing-thumbnail',
                            child: Box({
                                className: 'thumbnail-box',
                                css: `
                                    background-image: url("${YTMusic.currentTrack?.thumbnail || ''}");
                                    background-size: contain;
                                    background-repeat: no-repeat;
                                    background-position: center;
                                    min-width: 48px;
                                    min-height: 48px;
                                `,
                                setup: box => {
                                    box.connect('realize', () => {
                                        const update = () => {
                                            const track = YTMusic.currentTrack;
                                            box.css = `
                                                background-image: url("${track?.thumbnail || ''}");
                                                background-size: contain;
                                                background-repeat: no-repeat;
                                                background-position: center;
                                                min-width: 48px;
                                                min-height: 48px;
                                            `;
                                        };
                                        YTMusic.connect('notify::current-track', update);
                                        update();
                                    });
                                },
                            }),
                        }),
                        Box({
                            vertical: true,
                            children: [
                                Label({
                                    className: 'ytm-now-playing-title txt-norm',
                                    hpack: 'start',
                                    truncate: 'end',
                                    maxWidthChars: 20,
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
                                    hpack: 'start',
                                    className: 'ytm-now-playing  txt-smallie',
                                    truncate: 'end',
                                    maxWidthChars: 12,
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
            Box({hexpand: true}),
         
        
        // Controls Section
 
                // Button({
                //     className: `control-button ${YTMusic.shuffle ? 'enabled' : ''}`,
                //     tooltipText: YTMusic.shuffle ? 'Shuffle Off' : 'Shuffle On',
                //     onClicked: () => YTMusic.shuffle = !YTMusic.shuffle,
                //     child: MaterialIcon('shuffle', YTMusic.shuffle ? 'normal colored' : 'normal'),
                //     css: `
                //         min-width: 28px;
                //         min-height: 28px;
                //         border-radius: 14px;
                //         padding: 4px;
                //         background-color: ${YTMusic.shuffle ? 'alpha(@accent, 0.2)' : 'alpha(@theme_fg_color, 0.1)'};
                //         margin: 1px;
                //     `,
                //     setup: setupCursorHover,
            Box({
                // xalign: 0,
                children: [
                        Button({
                            className: 'control-button sec-txt',
                            tooltipText: 'play/pause',
                            child: MaterialIcon('skip_previous', 'normal'),
                            onClicked: () => {
                                YTMusic._sendMpvCommand(['playlist-prev']);
                                return true;
                            },
                            setup: setupCursorHover,
                        }),
                        Button({
                            className: 'button-play',
                            child: MaterialIcon(YTMusic.playing ? 'pause' : 'play_arrow', 'larger'),
                            onClicked: () => {
                                YTMusic.playing ? YTMusic._sendMpvCommand(['cycle', 'pause']) : YTMusic.play();
                                return true;
                            },
                            setup: setupCursorHover,
                        }),
                        Button({
                            className: 'control-button',
                            child: MaterialIcon('skip_next', 'normal'),
                            onClicked: () => {
                                YTMusic._sendMpvCommand(['playlist-next']);
                                return true;
                            },
                            setup: setupCursorHover,
                        }),

                        Button({
                            className: 'control-button',
                            tooltipText: 'Toggle between home and downloads',
                            child: MaterialIcon('home', 'normal'),
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
                
                ]
                    }),
                // Button({
                //     className: `control-button ${YTMusic.repeat ? 'enabled' : ''}`,
                //     tooltipText: YTMusic.repeat ? 'Repeat Off' : 'Repeat On',
                //     onClicked: () => YTMusic.repeat = !YTMusic.repeat,
                //     child: MaterialIcon('repeat', YTMusic.repeat ? 'normal colored' : 'normal'),
                //     css: `
                //         min-width: 28px;
                //         min-height: 28px;
                //         border-radius: 14px;
                //         padding: 4px;
                //         background-color: ${YTMusic.repeat ? 'alpha(@accent, 0.2)' : 'alpha(@theme_fg_color, 0.1)'};
                //         margin: 0 1px;
                //     `,
                //     setup: setupCursorHover,
                // }),
                // Button({
                //     className: 'control-button warning',
                //     tooltipText: 'Stop All Instances',
                //     onClicked: () => {
                //         YTMusic.stopAllInstances();
                //         return true;
                //     },
                //     child: MaterialIcon('stop_circle', 'normal'),
                //     css: `
                //         min-width: 28px;
                //         min-height: 28px;
                //         border-radius: 14px;
                //         padding: 4px;
                //         background-color: alpha(@error_color, 0.1);
                //         color: @error_color;
                //         margin: 0 1px;
                //     `,
                //     setup: setupCursorHover,
                // }),
             
        // // Track Progress Slider
        // Box({
        //     className: 'ytm-seek-slider spacing-v-5 margin-rl-15',
        //     vertical: true,
        //     children: [
        //         Widget.Slider({
        //             className: 'track-progress',
        //             drawValue: false,
        //             onChange: ({ value }) => {
        //                 if (!YTMusic.duration) return;
        //                 YTMusic.seek(value * YTMusic.duration);
        //             },
        //             setup: slider => {
        //                 slider.hook(YTMusic, () => {
        //                     if (!YTMusic.position || !YTMusic.duration) {
        //                         slider.visible = false;
        //                         return;
        //                     }
        //                     slider.visible = true;
        //                     slider.value = YTMusic.position / YTMusic.duration;
        //                 });
        //             },
        //         }),
        //         Box({
        //             homogeneous: true,
        //             children: [
        //                 Label({
        //                     className: 'txt-smallie txt',
        //                     setup: label => {
        //                         label.hook(YTMusic, () => {
        //                             label.label = formatTime(YTMusic.position || 0);
        //                         });
        //                     },
        //                 }),
        //                 Label({
        //                     className: 'txt-smallie txt',
        //                     hpack: 'end',
        //                     setup: label => {
        //                         label.hook(YTMusic, () => {
        //                             label.label = formatTime(YTMusic.duration || 0);
        //                         });
        //                     },
        //                 }),
        //             ],
        //         }),
        //     ],
        // }),
        
        // Volume Control at the bottom
        // VolumeControl(),
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
    // className: 'ytm-results',
    vertical: true,
    setup: box => {
        const itemCache = new Map();
        
        const createTrackItem = (item) => {
            const musicDir = GLib.get_home_dir() + '/Music';
            const localFile = `${musicDir}/${item.title}.opus`;
            const isDownloaded = GLib.file_test(localFile, GLib.FileTest.EXISTS);

            return Widget.Box({
                className: 'track-item',
                children: [
                    Widget.Box({
                        className: 'track-thumbnail',
                        css: `
                            background-image: url("${item.thumbnail || ''}");
                            background-size: contain;
                            background-repeat: no-repeat;
                            background-position: center;
                            min-width: 48px;
                            min-height: 48px;
                            margin-right: 8px;
                        `,
                    }),
                    Widget.Button({
                        className: 'track-title-button',
                        hexpand: true,
                        child: Widget.Box({
                            vertical: true,
                            children: [
                                Widget.Label({
                                    label: item.title,
                                    xalign: 0,
                                    justification: 'left',
                                    className: 'track-title',
                                    wrap: true,
                                    lines: 2,
                                    ellipsize: 3,
                                }),
                                Widget.Label({
                                    label: item.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
                                    xalign: 0,
                                    justification: 'left',
                                    className: 'track-artist',
                                    wrap: true,
                                    lines: 1,
                                    ellipsize: 3,
                                }),
                            ],
                        }),
                        onClicked: () => YTMusic.play(item.videoId),
                    }),
                    Widget.Button({
                        className: `download-button control-button ${isDownloaded ? 'cached' : YTMusic.cachingStatus[item.videoId] || ''}`,
                        child: Widget.Box({
                            homogeneous: true,
                            child: MaterialIcon(
                                isDownloaded ? 'download_done' :
                                YTMusic.cachingStatus[item.videoId] === 'caching' ? 'downloading' :
                                YTMusic.cachingStatus[item.videoId] === 'error' ? 'error' :
                                'download'
                            ),
                        }),
                        onClicked: () => YTMusic.cacheTrack(item.videoId),
                        tooltipText: isDownloaded ? 'Downloaded' :
                                   YTMusic.cachingStatus[item.videoId] === 'caching' ? 'Downloading...' :
                                   YTMusic.cachingStatus[item.videoId] === 'error' ? 'Download failed' :
                                   'Download track',
                        setup: button => {
                            setupCursorHover(button);
                            
                            const updateStyle = () => {
                                const status = isDownloaded ? 'cached' : YTMusic.cachingStatus[item.videoId];
                                button.className = `download-button control-button ${status || ''}`;
                            };
                            
                            YTMusic.connect('notify::caching-status', updateStyle);
                            updateStyle();
                        },
                    }),
                ],
            });
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
export const ytmusicTabIcon = Icon({
    hpack: 'center',
    size: '22',
    icon: `youtube-music-symbolic`,
});
