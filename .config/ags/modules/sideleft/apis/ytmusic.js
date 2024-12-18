const { Gtk, Gdk, GObject } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import YTMusic from '../../../services/ytmusic.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import GLib from 'gi://GLib';

const { Box, Button, Icon, Label, Revealer, Scrollable, Entry, Slider } = Widget;

// Media Controls
export const MediaControls = () => Box({
    className: 'ytm-controls',
    css:"margin-bottom :-0.35rem",
    vertical: true,
    children: [
        // Now Playing Section
        Box({
            className: 'ytm-now-playing',
            css:"font-size:1rem;font-weight:500",
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
                                        // Wrap text at 30 characters
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
                            wrap: true,
                            setup: label => {
                                label.connect('realize', () => {
                                    const update = () => {
                                        const track = YTMusic.currentTrack;
                                        const mpris = Mpris.players.find(p => p.identity === 'mpv');
                                        const artists = track?.artists?.map(a => a.name).join(', ') || 
                                                      mpris?.trackArtists?.join(', ') || '';
                                        // Wrap text at 35 characters
                                        label.label = artists.length > 35 ? 
                                            artists.slice(0, 35) + '...' : 
                                            artists;
                                    };
                                    YTMusic.connect('notify::current-track', update);
                                    Mpris.connect('player-changed', update);
                                    update();
                                });
                            },
                        }),
                        Box({
                            className: 'ytm-playback-controls',
                            hpack: 'center',
                            spacing: 8,
                            css: "margin-top: 0.5rem",
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
                                Button({
                                    className: 'ytm-toggle-view-button control-button sec-txt',
                                    tooltipText: 'Toggle between home and downloads',
                                    child: MaterialIcon('home', 'larger'),
                                    onClicked: () => {
                                        YTMusic.toggleDownloadedView();
                                        // Trigger a search to refresh results
                                        YTMusic.search(YTMusic._currentSearchQuery);
                                    },
                                    setup: button => {
                                        setupCursorHover(button);
                                        // Update icon based on current mode
                                        const updateIcon = () => {
                                            button.child.label = YTMusic.showDownloaded ? 'home' : 'download_done';
                                        };
                                        YTMusic.connect('notify::show-downloaded', updateIcon);
                                        updateIcon();
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
            className: 'ytm-controls-box',
            children: [
            ],
        }),
    ],
});


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
    child: MaterialIcon('music_note', 'larger'),
});

// Add styles

App.connect('config-parsed', () => {
    App.stylesheet += css;
});
