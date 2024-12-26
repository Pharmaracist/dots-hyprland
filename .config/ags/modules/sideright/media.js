import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import YTMusic from '../../services/ytmusic.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import { TabContainer } from '../.commonwidgets/tabcontainer.js';

// Queue tab component
const QueueList = () => {
    const queueList = Widget.Box({
        vertical: true,
        className: 'queue-list',
    });

    const updateQueueList = async () => {
        queueList.children = [];
        const currentTrack = YTMusic.currentTrack;
        
        // Show current track if available
        if (currentTrack) {
            const currentTrackWidget = Widget.Button({
                child: Widget.Box({
                    children: [
                        MaterialIcon('play_circle', 'norm'),
                        Widget.Label({
                            label: `Now Playing: ${currentTrack.trackTitle || 'Unknown Track'}`,
                            xalign: 0,
                            justification: 'left',
                            wrap: true,
                            className: 'queue-track-label current',
                        }),
                    ],
                    homogeneous: false,
                    spacing: 8,
                }),
                className: 'queue-track-button current',
            });
            queueList.add(currentTrackWidget);

            try {
                // Get related tracks
                const relatedTracks = await YTMusic._getRelatedTracks(currentTrack.videoId);
                if (relatedTracks && relatedTracks.length > 0) {
                    relatedTracks.forEach((track, index) => {
                        const trackItem = Widget.Button({
                            child: Widget.Box({
                                children: [
                                    MaterialIcon('queue_music', 'norm'),
                                    Widget.Label({
                                        label: track.title || 'Unknown Track',
                                        xalign: 0,
                                        justification: 'left',
                                        wrap: true,
                                        className: 'queue-track-label',
                                    }),
                                ],
                                homogeneous: false,
                                spacing: 8,
                            }),
                            className: 'queue-track-button',
                            onClicked: () => {
                                YTMusic.play(track.videoId);
                            },
                        });
                        queueList.add(trackItem);
                    });
                } else {
                    queueList.add(Widget.Label({
                        label: 'No upcoming tracks',
                        className: 'queue-empty-label',
                    }));
                }
            } catch (error) {
                console.error('Error getting related tracks:', error);
                queueList.add(Widget.Label({
                    label: 'Error loading upcoming tracks',
                    className: 'queue-empty-label',
                }));
            }
        } else {
            queueList.add(Widget.Label({
                label: 'No track playing',
                className: 'queue-empty-label',
            }));
        }
    };

    const widget = Widget.Box({
        vertical: true,
        className: 'queue-widget',
        children: [
            Widget.Scrollable({
                child: queueList,
                vexpand: true,
                hscroll: 'never',
                className: 'queue-scrollable',
            }),
        ],
    });

    // Update queue when current track changes
    widget.hook(YTMusic, () => Utils.timeout(1, updateQueueList), 'current-track');
    widget.hook(YTMusic, () => Utils.timeout(1, updateQueueList), 'playing');
    
    Utils.timeout(1, updateQueueList);
    return widget;
};

// Audio files tab component
const AudioFiles = ({ directory = GLib.get_home_dir() + '/Music' } = {}) => {
    const fileList = Widget.Box({
        vertical: true,
        className: 'audio-files-list',
    });

    const updateFileList = () => {
        const dir = Gio.File.new_for_path(directory);
        fileList.children = [];
        
        try {
            const enumerator = dir.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
            let fileInfo;
            
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const filename = fileInfo.get_name();
                if (!filename.match(/\.(mp3|wav|ogg|m4a|flac|opus)$/i)) continue;

                const button = Widget.Button({
                    child: Widget.Box({
                        children: [
                            Widget.Icon({
                                icon: 'audio-x-generic-symbolic',
                                size: 24,
                                className: 'audio-files-icon',
                            }),
                            Widget.Label({
                                label: filename,
                                xalign: 0,
                                justification: 'left',
                                wrap: true,
                                className: 'audio-files-label',
                            }),
                        ],
                        homogeneous: false,
                        spacing: 8,
                    }),
                    className: 'audio-files-button',
                    onClicked: () => {
                        const filepath = GLib.build_filenamev([directory, filename]);
                        const proc = Gio.Subprocess.new(
                            ['xdg-open', filepath],
                            Gio.SubprocessFlags.NONE
                        );
                        proc.wait_async(null, () => {});
                    },
                });

                fileList.add(button);
            }
        } catch (error) {
            console.error('Error reading directory:', error);
        }
    };

    const widget = Widget.Box({
        vertical: true,
        className: 'audio-files-widget',
        children: [
            Widget.Scrollable({
                child: fileList,
                vexpand: true,
                hscroll: 'never',
                className: 'audio-files-scrollable',
            }),
        ],
    });

    updateFileList();
    return widget;
};

// Export the media tabs widget using the common TabContainer
export default () => TabContainer({
    icons: ['folder_open', 'queue_music'],
    names: ['Files', 'Queue'],
    children: [AudioFiles(), QueueList()],
    className: 'sidebar-group',
});