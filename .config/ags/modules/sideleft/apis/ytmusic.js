const { Gtk, Gdk, GObject } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import YTMusic from '../../../services/ytmusic.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';

const { Box, Button, Icon, Label, Revealer, Scrollable, Entry, Slider } = Widget;

// Media Controls
export const MediaControls = () => Box({
    className: 'ytm-controls',
    vertical: true,
    children: [
        // Now Playing Section
        Box({
            className: 'ytm-now-playing',
            children: [
                Box({
                    className: 'ytm-now-playing-thumb',
                    setup: box => {
                        box.connect('realize', () => {
                            const update = () => {
                                const track = YTMusic.currentTrack;
                                box.css = track?.thumbnail ? 
                                    `background-image: url("${track.thumbnail}");` : 
                                    'background-image: none;';
                            };
                            YTMusic.connect('notify::current-track', update);
                            update();
                        });
                    },
                }),
                Box({
                    className: 'ytm-now-playing-info',
                    vertical: true,
                    children: [
                        Label({
                            className: 'ytm-now-playing-title',
                            xalign: 0,
                            justification: 'left',
                            wrap: true,
                            setup: label => {
                                label.connect('realize', () => {
                                    const update = () => {
                                        const track = YTMusic.currentTrack;
                                        label.label = track?.title || 'Not playing';
                                    };
                                    YTMusic.connect('notify::current-track', update);
                                    update();
                                });
                            },
                        }),
                        Label({
                            className: 'ytm-now-playing-artist',
                            xalign: 0,
                            justification: 'left',
                            wrap: true,
                            setup: label => {
                                label.connect('realize', () => {
                                    const update = () => {
                                        const track = YTMusic.currentTrack;
                                        const artists = track?.artists?.map(a => a.name || a).filter(Boolean) || [];
                                        label.label = artists.join(', ');
                                    };
                                    YTMusic.connect('notify::current-track', update);
                                    update();
                                });
                            },
                        }),
                        Box({
                            className: 'ytm-progress',
                            children: [
                                Slider({
                                    className: 'ytm-progress-slider',
                                    drawValue: false,
                                    onChange: ({ value }) => YTMusic.seek(value),
                                    setup: slider => {
                                        const update = () => {
                                            slider.adjustment.upper = YTMusic._duration || 100;
                                            slider.value = YTMusic._position || 0;
                                        };
                                        YTMusic.connect('notify::position', update);
                                        YTMusic.connect('notify::duration', update);
                                        update();
                                    },
                                }),
                                Label({
                                    className: 'ytm-progress-time',
                                    setup: label => {
                                        const formatTime = (seconds) => {
                                            if (!seconds) return '0:00';
                                            const mins = Math.floor(seconds / 60);
                                            const secs = Math.floor(seconds % 60);
                                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                                        };
                                        const update = () => {
                                            const position = formatTime(YTMusic._position);
                                            const duration = formatTime(YTMusic._duration);
                                            label.label = `${position} / ${duration}`;
                                        };
                                        YTMusic.connect('notify::position', update);
                                        YTMusic.connect('notify::duration', update);
                                        update();
                                    },
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        }),
        // Controls Section
        Box({
            className: 'ytm-playback-controls',
            hpack: 'center',
            spacing: 8,
            children: [
                Button({
                    className: 'control-button',
                    child: MaterialIcon(YTMusic.shuffle ? 'shuffle_on' : 'shuffle', 'norm'),
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
                    className: 'control-button',
                    child: MaterialIcon('skip_previous', 'norm'),
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
                            className: 'control-button',
                            child: MaterialIcon(YTMusic.playing ? 'pause' : 'play_arrow', 'large'),
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
                    className: 'control-button',
                    child: MaterialIcon('skip_next', 'norm'),
                    onClicked: () => {
                        YTMusic._sendMpvCommand(['playlist-next']);
                        return true;
                    },
                    setup: setupCursorHover,
                }),

                Button({
                    className: 'control-button',
                    child: MaterialIcon(YTMusic.repeat ? 'repeat_one' : 'repeat', 'norm'),
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
                Button({
                    className: 'control-button',
                    child: MaterialIcon(YTMusic.showDownloaded ? '󰇄' : '󰇣', 'norm'),
                    onClicked: () => YTMusic.toggleDownloadedView(),
                    setup: button => {
                        setupCursorHover(button);
                        YTMusic.connect('notify::show-downloaded', () => {
                            button.child.label = YTMusic.showDownloaded ? '󰇄' : '󰇣';
                        });
                    },
                }),
            ],
        }),
    ],
});

// Search Header
const SearchHeader = () => Box({
    className: 'ytm-header',
    children: [
        Entry({
            className: 'ytm-search',
            placeholderText: 'Search YouTube Music...',
            onAccept: ({ text }) => YTMusic.search(text),
        }),
        Button({
            className: 'ytm-toggle-view-button control-button',
            child: MaterialIcon('󰇣', 'norm'),
            onClicked: () => YTMusic.toggleDownloadedView(),
            setup: button => {
                setupCursorHover(button);
                YTMusic.connect('notify::show-downloaded', () => {
                    button.child.label = YTMusic.showDownloaded ? '󰇄' : '󰇣';
                });
            },
        }),
    ],
});

// Search Results
const SearchResults = () => Box({
    className: 'ytm-results',
    vertical: true,
    setup: box => {
        const update = () => {
            const results = YTMusic.searchResults;
            if (!results || !Array.isArray(results) || results.length === 0) {
                box.children = [
                    Box({
                        vertical: true,
                        className: 'ytm-no-results',
                        children: [
                            MaterialIcon('music_note', 'large'),
                            Label({
                                label: YTMusic.showDownloaded ? 
                                    'No downloaded songs found' : 
                                    'Search for music on YouTube',
                                className: 'title',
                            }),
                        ],
                    }),
                ];
                return;
            }

            box.children = results.map(item => Button({
                className: 'track-item',
                onClicked: () => YTMusic.play(item.videoId),
                child: Box({
                    children: [
                        Box({
                            className: 'track-item-thumb',
                            setup: box => {
                                box.css = item.thumbnail ? 
                                    `background-image: url("${item.thumbnail}");` : 
                                    'background-image: none;min-width:1rem;min-height:1rem;padding:1rem;';
                            },
                        }),
                        Box({
                            className: 'track-item-info',
                            vertical: true,
                            children: [
                                Label({
                                    label: item.title,
                                    xalign: 0,
                                    justification: 'left',
                                    className: 'track-item-title',
                                    wrap: true,
                                }),
                                Label({
                                    label: item.artists.map(a => a.name).join(', '),
                                    xalign: 0,
                                    justification: 'left',
                                    className: 'track-item-artist',
                                    wrap: true,
                                }),
                            ],
                        }),
                        Box({
                            className: 'track-item-tags',
                            children: [
                                // Downloaded tag
                                item.isDownloaded && Label({
                                    className: 'track-item-tag',
                                    label: 'Downloaded',
                                }),
                                // Caching status tag
                                Label({
                                    className: `track-item-caching ${YTMusic.cachingStatus[item.videoId] || ''}`,
                                    setup: label => {
                                        const update = () => {
                                            const status = YTMusic.cachingStatus[item.videoId];
                                            label.label = status === 'caching' ? 'Caching...' :
                                                         status === 'cached' ? 'Cached' :
                                                         status === 'error' ? 'Error' : '';
                                            label.visible = !!status;
                                        };
                                        YTMusic.connect('notify::caching-status', update);
                                        update();
                                    },
                                }),
                                // Download button (only show if not downloaded/cached)
                                !item.isDownloaded && Button({
                                    className: 'control-button',
                                    child: MaterialIcon('download', 'small'),
                                    onClicked: () => YTMusic.cacheTrack(item.videoId),
                                    setup: setupCursorHover,
                                }),
                            ].filter(Boolean), // Remove null/undefined items
                        }),
                    ],
                }),
            }));
        };

        YTMusic.connect('notify::search-results', update);
        YTMusic.connect('notify::show-downloaded', update);
        update();
    },
});

// Export the view
export const ytmusicView = Box({
    className: 'ytmusic-view',
    vertical: true,
    children: [
        SearchHeader(),
        Scrollable({
            vexpand: true,
            child: SearchResults(),
        }),
        MediaControls(),
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
    className: 'txt-norm icon-material ',
    icon: 'music-note',
});

// Add styles

App.connect('config-parsed', () => {
    App.stylesheet += css;
});
