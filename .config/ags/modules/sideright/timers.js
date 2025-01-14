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
    const timeLabel = Label({
        className: 'txt-small',
        label: formatTime(timer.remaining),
    });

    const endTimeLabel = Label({
        className: 'txt-smallie txt-subtext',
        label: getEndTime(timer.remaining),
    });

    const startBtn = Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        child: MaterialIcon(timer.running ? 'pause' : 'play_arrow', 'norm', {
            className: 'sidebar-timer-icon',
        }),
        onClicked: () => {
            if (timer.running) {
                timers.stopTimer(timer.id);
                startBtn.child = MaterialIcon('play_arrow', 'norm', {
                    className: 'sidebar-timer-icon',
                });
            } else {
                timers.startTimer(timer.id);
                startBtn.child = MaterialIcon('pause', 'norm', {
                    className: 'sidebar-timer-icon',
                });
            }
        },
        setup: setupCursorHover,
    });

    const resetBtn = Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        child: MaterialIcon('restart_alt', 'norm', { className: 'sidebar-timer-icon' }),
        onClicked: () => timers.resetTimer(timer.id),
        setup: setupCursorHover,
    });

    const deleteBtn = Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        child: MaterialIcon('delete', 'norm', { className: 'sidebar-timer-icon' }),
        onClicked: () => timers.removeTimer(timer.id),
        setup: setupCursorHover,
    });

    const controls = Box({
        className: 'spacing-h-5',
        children: [startBtn, resetBtn, deleteBtn],
    });

    const notifyComplete = () => {
        execAsync(['notify-send', `Timer Complete`, `${timer.name} timer has finished!`]);
        execAsync(['paplay', '/usr/share/sounds/freedesktop/stereo/complete.oga']);
    };

    const updateDisplay = () => {
        timeLabel.label = formatTime(timer.remaining);
        endTimeLabel.label = getEndTime(timer.remaining);
        
        if (timer.remaining === 0 && !timer.notified) {
            notifyComplete();
            timer.notified = true;
        }
    };

    const timerBox = Box({
        css: "font-size:1.1rem",
        className: 'spacing-h-5 sidebar-timer-item',
        child: Box({
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
        }),
    });

    timerBox.hook(timers, () => {
        const updatedTimer = timers.getTimer(timer.id);
        if (updatedTimer) {
            timer = updatedTimer;
            updateDisplay();
        }
    }, 'updated');

    updateDisplay();
    return timerBox;
};

const TimersList = () => {
    const box = Box({
        vertical: true,
        className: 'spacing-v-5 txt-norm',
    });

    const update = () => {
        box.get_children().forEach(child => {
            box.remove(child);
            child.destroy();
        });
        box.children = timers.timers.map(timer => TimerItem(timer));
    };

    box.hook(timers, update, 'updated');
    update();

    return box;
};

export const TimerWidget = () => {
    const timersList = TimersList();

    const presetButtons = PRESET_TIMERS.map(preset => Button({
        className: 'sidebar-timer-btn sidebar-timer-btn-start',
        tooltipText: preset.tooltip,
        child: MaterialIcon(preset.icon, 'norm', { 
            className: 'sidebar-timer-icon' 
        }),
        onClicked: () => timers.addTimer(preset.name, preset.duration),
        setup: setupCursorHover,
    }));

    const widget = Box({
        vertical: true,
        className: 'spacing-v-5',
        children: [
            Box({
                css: "margin-top:0.4rem",
                className: 'spacing-h-5',
                children: [
                    Label({
                        hexpand: true,
                        xalign: 0,
                        className: 'txt txt-large txt-bold',
                        label: 'Timers',
                    }),
                ],
            }),
            Box({
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
                                children: presetButtons,
                            }),
                        }),
                    }),
                ],
            }),
            Box({
                className: 'spacing-v-5',
                vertical: true,
                vexpand: true,
                child: Scrollable({
                    vexpand: true,
                    child: timersList,
                    setup: scrollable => {
                        const vScrollbar = scrollable.get_vscrollbar();
                        vScrollbar.get_style_context().add_class('sidebar-scrollbar');
                    },
                }),
            }),
        ],
    });

    return widget;
};