import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Box, Button, Label, Entry, Revealer, Scrollable } = Widget;
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../.widgetutils/cursorhover.js';
import userOptions from '../.configuration/user_options.js';
import timers from '../../services/timers.js';
import { execAsync } from 'resource:///com/github/Aylur/ags/utils.js';

const options = userOptions.asyncGet();
const PRESET_TIMERS = options.timers.presets.map(preset => ({
    name: preset.name,
    duration: preset.duration,
    icon: preset.icon || 'timer',
    tooltip: `${preset.name}: ${Math.floor(preset.duration / 60)} minutes`,
}));

const ANIMATION_DURATION = options.animations.durationSmall;

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getEndTime = (remainingSeconds) => {
    const now = new Date();
    const endTime = new Date(now.getTime() + remainingSeconds * 1000);
    return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TimerItem = (timer) => {
    const timerBox = Box({
        css:"font-size:1.1rem",
        className: 'spacing-h-5 sidebar-timer-item',
    });

    const notifyComplete = () => {
        execAsync(['notify-send', `Timer Complete`, `${timer.name} timer has finished!`]);
        execAsync(['paplay', '/usr/share/sounds/freedesktop/stereo/complete.oga']);
    };

    const updateDisplay = () => {
        timeLabel.label = formatTime(timer.remaining);
        endTimeLabel.label = getEndTime(timer.remaining);
        
        // Check if timer just finished
        if (timer.remaining === 0 && !timer.notified) {
            notifyComplete();
            timer.notified = true;
        }
    };

    const updateButtonState = (running) => {
        startBtn.child = MaterialIcon(running ? 'pause' : 'play_arrow', 'norm', {
            className: 'sidebar-timer-icon',
        });
    };

    const timeLabel = Label({
        className: 'txt-small',
    });

    const endTimeLabel = Label({
        className: 'txt-smallie txt-subtext',
    });

    const startBtn = Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        child: MaterialIcon(timer.running ? 'pause' : 'play_arrow', 'norm', {
            className: 'sidebar-timer-icon',
        }),
        setup: setupCursorHover,
        onClicked: () => {
            if (timer.running) {
                timers.stopTimer(timer.id);
                updateButtonState(false);
            } else {
                timers.startTimer(timer.id);
                updateButtonState(true);
            }
        },
    });

    const resetBtn = Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        child: MaterialIcon('restart_alt', 'norm', { className: 'sidebar-timer-icon' }),
        setup: setupCursorHover,
        onClicked: () => timers.resetTimer(timer.id),
    });

    const deleteBtn = Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        child: MaterialIcon('delete', 'norm', { className: 'sidebar-timer-icon' }),
        setup: setupCursorHover,
        onClicked: () => timers.removeTimer(timer.id),
    });

    const controls = Box({
        className: 'spacing-h-5',
        children: [startBtn, resetBtn, deleteBtn],
    });

    const timerContent = Box({
        className: 'spacing-h-10',
        hexpand: true,
        children: [
            Box({
                vertical: true,
                children: [
                    Box({
                        className: 'spacing-h-5',
                        children: [
                            Label({
                                xalign: 0,
                                hexpand: true,
                                className: 'txt-smallie',
                                label: timer.name,
                            }),
                            timeLabel,
                        ],
                    }),
                    endTimeLabel,
                ],
            }),
            controls,
        ],
    });

    timerBox.child = timerContent;

    // Update display when timer updates
    timerBox.hook(timers, () => {
        const updatedTimer = timers.getTimer(timer.id);
        if (updatedTimer) {
            updateDisplay();
            // Only update button if running state changed
            if (timer.running !== updatedTimer.running) {
                updateButtonState(updatedTimer.running);
            }
            timer = updatedTimer;
        }
    }, 'updated');

    updateDisplay();
    return timerBox;
};

const TimersList = () => Box({
    vertical: true,
    className: 'spacing-v-5 txt-norm',
    setup: self => {
        self.hook(timers, () => {
            self.children = timers.timers.map(timer => TimerItem(timer));
        }, 'updated');
    },
});

export const TimerWidget = () => {
    const timersList = TimersList();

    const header = Box({
        css:"margin-top:0.4rem",
        className: 'spacing-h-5',
        children: [
            Label({
                hexpand: true,
                xalign: 0,
                className: 'txt txt-large txt-bold',
                label: 'Timers',
            }),
        ],
    });

    const scrollArea = Scrollable({
        vexpand: true,
        child: timersList,
        setup: (scrollable) => {
            const vScrollbar = scrollable.get_vscrollbar();
            vScrollbar.get_style_context().add_class('sidebar-scrollbar');
        },
    });

    const presetButtons = Box({
        className: 'sidebar-timer-presets',
        children: [
            Box({
                hexpand: true,
                child: Scrollable({
                    hexpand: true,
                    hscroll: 'always',
                    vscroll: 'never',
                    child: Box({
                        hexpand: true,
                        className: 'spacing-h-5',
                        children: PRESET_TIMERS.map(preset => Button({
                            className: 'sidebar-timer-btn sidebar-timer-btn-start',
                            tooltipText: preset.tooltip,
                            child: MaterialIcon(preset.icon, 'norm', { className: 'sidebar-timer-icon' }),
                            setup: setupCursorHover,
                            onClicked: () => {
                                const name = preset.name;
                                const duration = preset.duration;
                                timers.addTimer(name, duration);
                            },
                        })),
                    }),
                }),
            }),
        ],
    });

    return Box({
        vertical: true,
        className: 'sidebar-group spacing-v-5',
        children: [
            header, 
            scrollArea,
            Box({  // Separator
                className: 'txt-subtext txt-small',
                hpack: 'center',
                child: Label({
                    label: 'Quick Presets',
                }),
            }),
            presetButtons,
        ],
        setup: self => {
            self.hook(timers, () => {
                timersList.children = timers.timers.map(timer => TimerItem(timer));
            }, 'updated');
        },
    });
};