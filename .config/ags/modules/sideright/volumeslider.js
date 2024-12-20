import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';

export const VolumeSlider = () => {
    const slider = Widget.Slider({
        className: 'sidebar-volmixer-stream-slider',
        drawValue: false,
        hpack: 'fill',
        value: Audio.speaker?.volume || 0,
        onChange: ({ value }) => {
            Audio.speaker.volume = value;
        },
        setup: slider => {
            const update = () => {
                slider.value = Audio.speaker?.volume || 0;
            };
            Audio.connect('speaker-changed', update);
            Audio.speaker?.connect('changed', update);
            update();
        },
    });

    const volumeIcon = Widget.Box({
        className: 'txt-norm sec-txt',
        vpack: 'center',
        setup: self => {
            const update = () => {
                const isMuted = Audio.speaker?.isMuted;
                const volume = Audio.speaker?.volume || 0;
                let iconName = '';

                if (isMuted || volume === 0) {
                    iconName = 'volume_off';
                } else if (volume < 0.3) {
                    iconName = 'volume_mute';
                } else if (volume < 0.7) {
                    iconName = 'volume_down';
                } else {
                    iconName = 'volume_up';
                }
                self.children = [MaterialIcon(iconName, 'norm')];
            };
            Audio.connect('speaker-changed', update);
            Audio.speaker?.connect('changed', update);
            update();
        },
    });

    return Widget.Box({
        className: 'spacing-h-10 margin-rl-15',
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
                }
                return true;
            });
        },
        children: [
            volumeIcon,
            Widget.Box({
                hexpand: true,
                vpack: 'center',
                vertical: true,
                className: 'spacing-v-5',
                children: [slider],
            }),
        ],
    });
};
