const { Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import YTMusic from '../../../services/ytmusic.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';

const { Box, Button, Icon, Label, Revealer, Scrollable, Entry, Slider } = Widget;

// Media Controls
export const MediaControls = () => {
    const mprisPlayer = () => Mpris.players.find(p => p.identity === 'mpv');

    return Box({
        className: 'media-controls',
        vertical: true,
        children: [
            Box({
                className: 'now-playing',
                children: [
                    Box({
                        className: 'thumbnail',
                        setup: box => {
                            box.hook(YTMusic, (box, track) => {
                                box.css = track?.thumbnail ? 
                                    `background-image: url("${track.thumbnail}");` : 
                                    'background-image: none;';
                            }, 'current-track');
                        },
                    }),
                    Box({
                        className: 'track-info',
                        vertical: true,
                        children: [
                            Label({
                                className: 'title',
                                xalign: 0,
                                justification: 'left',
                                wrap: true,
                                setup: label => {
                                    label.hook(YTMusic, (label, track) => {
                                        if (track) {
                                            label.label = track.title;
                                        } else {
                                            const player = mprisPlayer();
                                            label.label = player?.trackTitle || 'Not playing';
                                        }
                                    }, 'current-track');
                                    label.hook(Mpris, (label) => {
                                        if (!YTMusic.currentTrack) {
                                            const player = mprisPlayer();
                                            label.label = player?.trackTitle || 'Not playing';
                                        }
                                    }, 'player-changed');
                                },
                            }),
                            Label({
                                className: 'artist',
                                xalign: 0,
                                justification: 'left',
                                wrap: true,
                                setup: label => {
                                    label.hook(YTMusic, (label, track) => {
                                        if (track) {
                                            label.label = track.artists?.map(a => a.name).join(', ') || '';
                                        } else {
                                            const player = mprisPlayer();
                                            label.label = player?.trackArtists?.join(', ') || '';
                                        }
                                    }, 'current-track');
                                    label.hook(Mpris, (label) => {
                                        if (!YTMusic.currentTrack) {
                                            const player = mprisPlayer();
                                            label.label = player?.trackArtists?.join(', ') || '';
                                        }
                                    }, 'player-changed');
                                },
                            }),
                        ],
                    }),
                ],
            }),
            Box({
                className: 'controls',
                hpack: 'center',
                spacing: 8,
                children: [
                    Button({
                        className: 'control-button',
                        child: MaterialIcon('skip_previous', 'large'),
                        setup: setupCursorHover,
                        onClicked: () => {
                            if (YTMusic.currentTrack) {
                                YTMusic.previous();
                            } else {
                                const player = mprisPlayer();
                                player?.previous();
                            }
                        },
                    }),
                    Button({
                        className: 'control-button',
                        setup: button => {
                            setupCursorHover(button);
                            const updatePlayState = () => {
                                const player = mprisPlayer();
                                const isPlaying = YTMusic.currentTrack ? 
                                    YTMusic.playing : 
                                    player?.playBackStatus === 'Playing';
                                button.child = MaterialIcon(isPlaying ? 'pause' : 'play_arrow', 'large');
                            };
                            button.hook(YTMusic, updatePlayState, 'playing');
                            button.hook(Mpris, updatePlayState, 'player-changed');
                        },
                        onClicked: () => {
                            if (YTMusic.currentTrack) {
                                YTMusic.togglePlay();
                            } else {
                                const player = mprisPlayer();
                                player?.playPause();
                            }
                        },
                    }),
                    Button({
                        className: 'control-button',
                        child: MaterialIcon('skip_next', 'large'),
                        setup: setupCursorHover,
                        onClicked: () => {
                            if (YTMusic.currentTrack) {
                                YTMusic.next();
                            } else {
                                const player = mprisPlayer();
                                player?.next();
                            }
                        },
                    }),
                ],
            }),
            Box({
                className: 'volume-control',
                children: [
                    Box({
                        className: 'volume-icon',
                        child: MaterialIcon('volume_up', 'large'),
                    }),
                    Slider({
                        className: 'volume-slider',
                        drawValue: false,
                        hexpand: true,
                        value: 1.0,
                        setup: slider => {
                            const updateVolume = () => {
                                if (YTMusic.currentTrack) {
                                    slider.value = YTMusic.volume;
                                } else {
                                    const player = mprisPlayer();
                                    if (player) slider.value = player.volume;
                                }
                            };
                            slider.hook(YTMusic, updateVolume, 'volume');
                            slider.hook(Mpris, updateVolume, 'player-changed');
                        },
                        onChange: ({ value }) => {
                            if (typeof value === 'number') {
                                if (YTMusic.currentTrack) {
                                    YTMusic.setVolume(value);
                                } else {
                                    const player = mprisPlayer();
                                    if (player) player.volume = value;
                                }
                            }
                        },
                    }),
                ],
            }),
        ],
    });
};

// Search Results Item
const SearchResultItem = ({ videoId, title, artists, album }) => Button({
    className: 'music-item',
    onClicked: () => YTMusic.play(videoId),
    child: Box({
        children: [
            Box({
                vertical: true,
                children: [
                    Label({
                        className: 'music-title',
                        label: title || 'Unknown Title',
                        xalign: 0,
                        justification: 'left',
                        wrap: true,
                    }),
                    Label({
                        className: 'music-artist',
                        label: artists?.map(a => a.name).join(', ') || 'Unknown Artist',
                        xalign: 0,
                        justification: 'left',
                        wrap: true,
                    }),
                   
                ],
            }),
        ],
    }),
    setup: setupCursorHover,
});

// Error Message
const ErrorMessage = () => Box({
    vertical: true,
    className: 'error-message',
    children: [
        MaterialIcon('error', 'large'),
        Label({
            className: 'error-title',
            label: YTMusic.bind('error').transform(error => error?.title || ''),
        }),
        Label({
            className: 'error-description',
            label: YTMusic.bind('error').transform(error => error?.description || ''),
        }),
    ],
    visible: YTMusic.bind('error').transform(error => !!error),
});

// Search Results List
const SearchResults = () => {
    console.log('YTMusic Widget: Creating SearchResults component');
    return Box({
        vertical: true,
        className: 'search-results',
        children: [
            Scrollable({
                vexpand: true,
                child: Box({
                    className: 'results-list',
                    vertical: true,
                    setup: box => {
                        box.hook(YTMusic, (box, results) => {
                            console.log('YTMusic Widget: Got search results update:', results);
                            if (!results || results.length === 0) {
                                console.log('YTMusic Widget: No results, showing empty state');
                                box.children = [Label({
                                    label: 'No results found',
                                    className: 'search-header',
                                    vpack: 'center',
                                    hpack: 'center',
                                })];
                            } else {
                                console.log('YTMusic Widget: Mapping results to items');
                                box.children = results.map(result => {
                                    console.log('YTMusic Widget: Creating item for:', result);
                                    return SearchResultItem(result);
                                });
                            }
                        }, 'search-results');
                    }
                }),
            }),
        ],
    });
};

// Export the view
export const ytmusicView = Box({
    className: 'ytmusic-view',
    vertical: true,
    children: [
        SearchResults(),
        MediaControls(),
    ],
});

// Export the widget
export const YTMusicWidget = Box({
    className: 'ytmusic-widget',
    vertical: true,
    children: [
        // Search Bar
        Box({
            className: 'search-box',
            children: [
                Entry({
                    className: 'search-input',
                    hexpand: true,
                    placeholderText: 'Search YouTube Music...',
                    onAccept: ({ text }) => YTMusic.search(text),
                    setup: setupCursorHover,
                }),
            ],
        }),
        // Error Message
        ErrorMessage(),
    ],
});

// Send message function for the API
export const sendMessage = (text) => {
    if (!text) return;
    YTMusic.search(text);
};

// Export the commands
export const ytmusicCommands = Box({
    className: 'commands-box',
});

// Export the tab icon
export const ytmusicTabIcon = MaterialIcon('music_note', 'large');

// Add styles

App.connect('config-parsed', () => {
    App.stylesheet += css;
});
