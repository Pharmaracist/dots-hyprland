import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Label, Entry, Revealer, Scrollable } = Widget;
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../.widgetutils/cursorhover.js';
import TimersService from "../../services/timers.js";

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const TimerItem = (timer) => {
    const timerDisplay = Label({
        className: 'sidebar-timer-display',
        label: formatTime(timer.remaining),
    });

    const updateDisplay = () => {
        timerDisplay.label = formatTime(timer.remaining);
    };

    const startStopBtn = Button({
        className: `sidebar-timer-btn ${timer.running ? 'sidebar-timer-btn-stop' : 'sidebar-timer-btn-start'}`,
        child: MaterialIcon(timer.running ? 'stop' : 'play_arrow', 'norm'),
        setup: setupCursorHover,
        onClicked: () => {
            if (timer.running) {
                TimersService.stopTimer(timer.id);
            } else {
                TimersService.startTimer(timer.id);
            }
        },
    });

    const resetBtn = Button({
        className: 'sidebar-timer-btn',
        child: MaterialIcon('restart_alt', 'norm'),
        setup: setupCursorHover,
        onClicked: () => TimersService.resetTimer(timer.id),
    });

    const deleteBtn = Button({
        className: 'sidebar-timer-btn',
        child: MaterialIcon('delete', 'norm'),
        setup: setupCursorHover,
        onClicked: () => TimersService.removeTimer(timer.id),
    });

    const controls = Box({
        className: 'sidebar-timer-controls spacing-h-5',
        homogeneous: true,
        children: [startStopBtn, resetBtn, deleteBtn],
    });

    const timerBox = Box({
        vertical: true,
        className: 'sidebar-timer',
        children: [
            Label({
                xalign: 0,
                className: 'txt txt-norm',
                hpack:'center',
                label: timer.name,
            }),
            timerDisplay,
            controls,
        ],
    });

    // Update display when timer updates
    const hook = timerBox.hook(TimersService, () => {
        const updatedTimer = TimersService.getTimer(timer.id);
        if (updatedTimer) {
            updateDisplay();
            startStopBtn.child = MaterialIcon(updatedTimer.running ? 'stop' : 'play_arrow', 'norm');
            startStopBtn.toggleClassName('sidebar-timer-btn-stop', updatedTimer.running);
            startStopBtn.toggleClassName('sidebar-timer-btn-start', !updatedTimer.running);
        }
    }, 'updated');

    timerBox.connect('destroy', () => {
        timerBox.unhook(hook);
    });

    return timerBox;
};

const NewTimerForm = () => {
    const newTaskButton = Revealer({
        transition: 'slide_left',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: true,
        child: Button({
            className: 'txt-small sidebar-todo-new',
            halign: 'end',
            vpack: 'center',
            label: getString('+ New timer'),
            setup: setupCursorHover,
            onClicked: (self) => {
                newTaskButton.revealChild = false;
                newTaskEntryRevealer.revealChild = true;
                confirmAddTask.revealChild = true;
                cancelAddTask.revealChild = true;
                nameEntry.grab_focus();
            }
        })
    });

    const cancelAddTask = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Button({
            className: 'txt-norm icon-material sidebar-todo-add',
            halign: 'end',
            vpack: 'center',
            label: 'close',
            setup: setupCursorHover,
            onClicked: (self) => {
                newTaskEntryRevealer.revealChild = false;
                confirmAddTask.revealChild = false;
                cancelAddTask.revealChild = false;
                newTaskButton.revealChild = true;
                nameEntry.text = '';
                durationEntry.text = '';
            }
        })
    });

    const nameEntry = Entry({
        className: 'sidebar-timer-entry',
        placeholderText: getString('Timer name'),
        onAccept: () => {
            const duration = parseInt(durationEntry.text) * 60; // Convert minutes to seconds
            if (nameEntry.text && !isNaN(duration) && duration > 0) {
                TimersService.addTimer(nameEntry.text, duration);
                nameEntry.text = '';
                durationEntry.text = '';
                newTaskEntryRevealer.revealChild = false;
                confirmAddTask.revealChild = false;
                cancelAddTask.revealChild = false;
                newTaskButton.revealChild = true;
            }
        },
    });

    const durationEntry = Entry({
        className: 'sidebar-timer-entry',
        placeholderText: getString('Duration (minutes)'),
        onAccept: () => {
            const duration = parseInt(durationEntry.text) * 60; // Convert minutes to seconds
            if (nameEntry.text && !isNaN(duration) && duration > 0) {
                TimersService.addTimer(nameEntry.text, duration);
                nameEntry.text = '';
                durationEntry.text = '';
                newTaskEntryRevealer.revealChild = false;
                confirmAddTask.revealChild = false;
                cancelAddTask.revealChild = false;
                newTaskButton.revealChild = true;
            }
        },
    });

    const confirmAddTask = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Button({
            className: 'txt-norm icon-material sidebar-todo-add',
            halign: 'end',
            vpack: 'center',
            label: 'arrow_upward',
            setup: setupCursorHover,
            onClicked: () => {
                const duration = parseInt(durationEntry.text) * 60; // Convert minutes to seconds
                if (nameEntry.text && !isNaN(duration) && duration > 0) {
                    TimersService.addTimer(nameEntry.text, duration);
                    nameEntry.text = '';
                    durationEntry.text = '';
                    newTaskEntryRevealer.revealChild = false;
                    confirmAddTask.revealChild = false;
                    cancelAddTask.revealChild = false;
                    newTaskButton.revealChild = true;
                }
            },
        })
    });

    const newTaskEntryRevealer = Revealer({
        transition: 'slide_right',
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        revealChild: false,
        child: Box({
            vertical: true,
            className: 'spacing-v-5',
            children: [nameEntry, durationEntry],
        }),
    });

    return Box({
        setup: (self) => {
            self.pack_start(cancelAddTask, false, false, 0);
            self.pack_start(newTaskEntryRevealer, true, true, 0);
            self.pack_start(confirmAddTask, false, false, 0);
            self.pack_start(newTaskButton, false, false, 0);
        }
    });
};

export const TimerWidget = () => {
    const timersList = Box({
        vertical: true,
        className: 'spacing-v-5 txt-norm',
    });

    const update = () => {
        const timers = TimersService.timers;
        timersList.children = timers.map(timer => TimerItem(timer));
    };

    const header = Box({
        css:"margin-top:0.4rem",
        className: 'spacing-h-5',
        children: [
            Label({
                hexpand: true,
                xalign: 0,
                className: 'txt txt-large txt-bold',
                label: getString('Timers'),
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

    return Box({
        vertical: true,
        className: 'spacing-v-10',
        setup: (box) => {
            const hook = box.hook(TimersService, update, 'updated');
            box.connect('destroy', () => box.unhook(hook));
            
            box.children = [header, scrollArea, NewTimerForm()];
            update();
        },
    });
};
