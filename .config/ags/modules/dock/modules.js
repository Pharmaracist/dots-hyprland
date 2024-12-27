import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../.widgetutils/cursorhover.js';
import { DockActiveApps } from './modules/active_apps.js';
import { DockPinnedApps } from './modules/pinned_apps.js';
import { dockPinned } from '../../variables.js';

// Pin button for dock
const PinButton = () => Widget.Button({
    className: 'pin-btn',
    child: Widget.Box({
        homogeneous: true,
        className: dockPinned.bind('value').transform(p => p ? 'pin-icon pinned' : 'pin-icon'),
        child: MaterialIcon('push_pin', 'norm'),
    }),
    onClicked: () => {
        dockPinned.value = !dockPinned.value;
    },
    setup: setupCursorHover,
});

// Launcher button
const LauncherButton = () => Widget.Button({
    className: 'launcher-btn',
    child: Widget.Box({
        homogeneous: true,
        className: 'launcher-icon',
        child: MaterialIcon('apps', 'norm'),
    }),
    onClicked: () => {
        App.toggleWindow('overview');
    },
    setup: setupCursorHover,
});

// Export dock modules
export const DockModules = {
    pin: PinButton,
    launcher: LauncherButton,
    taskbar: DockActiveApps,
    pinned: DockPinnedApps,
};
