import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Media from '../../services/media.js';

const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

const SongList = () => {
    const list = Widget.Box({
        vertical: true,
        className: 'song-list',
        children: [],
    });

    const update = () => {
        const songs = Media.songs;
        const currentSong = Media.currentSong;
        console.log('Updating widget with songs:', songs);
        
        list.children = [
            Widget.Button({
                className: 'media-refresh-btn',
                child: Widget.Label({ 
                    className: 'txt-norm icon-material',
                    label: 'refresh',
                }),
                onClicked: () => Media.refresh(),
            }),
            Widget.Box({
                className: 'songs-container',
                vertical: true,
                children: songs.map(song => {
                    const metadata = Media.getMetadata(song);
                    const isPlaying = currentSong === song;
                    
                    return Widget.Button({
                        className: `song-item ${isPlaying ? 'playing' : ''}`,
                        onClicked: () => {
                            if (isPlaying) {
                                Media.togglePlay();
                            } else {
                                Media.playSong(song);
                            }
                        },
                        child: Widget.Box({
                            children: [
                                Widget.Label({
                                    className: 'song-status txt-norm icon-material',
                                    label: isPlaying ? (Media.isPlaying ? 'pause' : 'play_arrow') : 'play_arrow',
                                }),
                                Widget.Box({
                                    vertical: true,
                                    children: [
                                        Widget.Label({
                                            className: 'song-title txt-bold',
                                            label: metadata.title,
                                            xalign: 0,
                                            truncate: 'end',
                                        }),
                                        Widget.Label({
                                            className: 'song-artist txt-norm',
                                            label: metadata.artist,
                                            xalign: 0,
                                            truncate: 'end',
                                        }),
                                    ],
                                }),
                                Widget.Box({ hexpand: true }),
                                Widget.Label({
                                    className: 'song-duration txt-norm',
                                    label: formatTime(metadata.duration),
                                }),
                            ],
                        }),
                    });
                }),
            }),
        ];
    };

    // Initial update
    update();

    // Listen for updates
    Media.connect('songs-updated', () => {
        console.log('Got songs-updated signal');
        update();
    });
    
    Media.connect('status-changed', () => {
        console.log('Got status-changed signal');
        update();
    });
    
    Media.connect('song-changed', () => {
        console.log('Got song-changed signal');
        update();
    });

    Media.connect('metadata', () => {
        console.log('Got metadata signal');
        update();
    });

    return Widget.Box({
        className: 'media-list-box',
        vertical: true,
        children: [
            Widget.Scrollable({
                vexpand: true,
                child: list,
            }),
        ],
    });
};

export default () => {
    console.log('Media module initializing');
    return Widget.Box({
        className: 'media-box',
        vertical: true,
        children: [SongList()],
        setup: () => Media.refresh(),
    });
};
