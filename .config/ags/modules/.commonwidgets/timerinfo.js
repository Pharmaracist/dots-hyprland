import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Box, Label } = Widget;
import { MaterialIcon } from './materialicon.js';
import timers from '../../services/timers.js';

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const TimerInfo = () => {
    const timerLabel = Label({
        className: 'txt-smallie',
    });

    const timerIcon = MaterialIcon('timer', 'norm');
    
    const widget = Box({
        className: 'spacing-h-5',
        children: [
            timerIcon,
            timerLabel,
        ],
        visible: false,
        connections: [
            [timers, (box) => {
                const activeTimer = timers.activeTimer;
                if (!activeTimer) {
                    box.visible = false;
                    return;
                }
                
                timerLabel.label = `${activeTimer.name} (${formatTime(activeTimer.remaining)})`;
                box.visible = true;
            }, 'timer-tick'],
            [timers, (box, isActive) => {
                box.visible = isActive;
            }, 'active-changed'],
        ],
    });

    return widget;
};
