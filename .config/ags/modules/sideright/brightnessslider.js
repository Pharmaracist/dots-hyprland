import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';

const getBrightness = () => {
    try {
        const current = Number(Utils.exec('brightnessctl get'));
        const max = Number(Utils.exec('brightnessctl max'));
        return current / max;
    } catch (error) {
        console.error('Error getting brightness:', error);
        return 1;
    }
};

const setBrightness = (value) => {
    const percentage = Math.round(value * 100);
    Utils.execAsync(['brightnessctl', 'set', `${percentage}%`]).catch(console.error);
};

export const BrightnessSlider = () => {
    const slider = Widget.Slider({
        className: 'sidebar-volmixer-stream-slider',
        drawValue: false,
        hpack: 'fill',
        value: getBrightness(),
        onChange: ({ value }) => {
            setBrightness(value);
        },
    });

    const icon = Widget.Box({
        className: 'txt-norm sec-txt',
        vpack: 'center',
        setup: self => {
            const update = () => {
                const brightness = slider.value;
                let iconName = '';

                if (brightness < 0.3) {
                    iconName = 'brightness_low';
                } else if (brightness < 0.7) {
                    iconName = 'brightness_medium';
                } else {
                    iconName = 'brightness_high';
                }
                self.children = [MaterialIcon(iconName, 'norm')];
            };
            
            slider.connect('notify::value', update);
            update();
        },
    });

    // Update brightness value periodically
    Utils.interval(2000, () => {
        const newValue = getBrightness();
        if (Math.abs(newValue - slider.value) > 0.01) {
            slider.value = newValue;
        }
        return true;
    });

    return Widget.Box({
        className: 'spacing-h-10 margin-rl-15',
        setup: box => {
            box.connect('scroll-event', (widget, event) => {
                const direction = event.get_scroll_deltas()[2];
                const step = 0.02;
                const currentValue = getBrightness();
                let newValue;

                if (direction < 0) {  // Scroll up
                    newValue = Math.min(1, currentValue + step);
                } else if (direction > 0) {  // Scroll down
                    newValue = Math.max(0, currentValue - step);
                }

                if (newValue !== undefined && newValue !== currentValue) {
                    setBrightness(newValue);
                    slider.value = newValue;
                }
                return true;
            });
        },
        children: [
            icon,
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
