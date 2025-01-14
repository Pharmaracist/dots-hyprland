"use strict";
// Import
import Gdk from 'gi://Gdk';
import App from 'resource:///com/github/Aylur/ags/app.js'
import Wallselect from './modules/wallselect/main.js';
// Stuff
import userOptions from './modules/.configuration/user_options.js';
import { firstRunWelcome, startBatteryWarningService } from './services/messages.js';
import { startAutoDarkModeService } from './services/darkmode.js';
// Widgets
import { Bar, BarCornerTopleft, BarCornerTopright } from './modules/bar/main.js';
import Cheatsheet from './modules/cheatsheet/main.js';
import DesktopBackground from './modules/desktopbackground/main.js';
import Dock from './modules/dock/main.js';
import Corner from './modules/screencorners/main.js';
import Indicator from './modules/indicators/main.js';
import Overview from './modules/overview/main.js';
import Session from './modules/session/main.js';
import SideLeft from './modules/sideleft/main.js';
import SideRight from './modules/sideright/main.js';
import { COMPILED_STYLE_DIR } from './init.js';

const range = (length, start = 1) => Array.from({ length }, (_, i) => i + start);
function forMonitors(widget) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    return range(n, 0).map(widget).flat(1);
}
function forMonitorsAsync(widget) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    return range(n, 0).forEach((n) => widget(n).catch(print))
}

// Start stuff
handleStyles(true);
startAutoDarkModeService().catch(print);
firstRunWelcome().catch(print);
startBatteryWarningService().catch(print)

// Create bars and corners
const monitors = Gdk.Display.get_default()?.get_n_monitors() || 1;
for (let i = 0; i < monitors; i++) {
    Bar(i).then(([mainBar, leftCorner, rightCorner]) => {
        App.addWindow(mainBar);
        App.addWindow(leftCorner);
        App.addWindow(rightCorner);
    }).catch(print);
}

const Windows = () => [
    Overview(),
    forMonitors(Indicator),
    forMonitors(Cheatsheet),
    SideLeft(),
    SideRight(),
    forMonitors(Session),
    ...(userOptions.asyncGet().desktopBackground.enabled !== false ? [forMonitors(DesktopBackground)] : []),
    ...(userOptions.asyncGet().wallselect.enabled !== false ? [Wallselect()] : []),
    ...(userOptions.asyncGet().dock.enabled ? [forMonitors(Dock)] : []),
    ...(userOptions.asyncGet().appearance.fakeScreenRounding !== 0 ? [
        forMonitors((id) => Corner(id, 'top left', true)),
        forMonitors((id) => Corner(id, 'top right', true)),
        forMonitors((id) => Corner(id, 'bottom left', true)),
        forMonitors((id) => Corner(id, 'bottom right', true)),
    ] : []),
];

const CLOSE_ANIM_TIME = 180; // Longer than actual anim time to make sure widgets animate fully
const closeWindowDelays = {}; // For animations
for (let i = 0; i < (Gdk.Display.get_default()?.get_n_monitors() || 1); i++) {
    closeWindowDelays[`osk${i}`] = CLOSE_ANIM_TIME;
}

App.config({
    css: `${COMPILED_STYLE_DIR}/style.css`,
    stackTraceOnError: true,
    closeWindowDelay: closeWindowDelays,
    windows: Windows().flat(1)
});

