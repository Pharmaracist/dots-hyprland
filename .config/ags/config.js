// "use strict";
// Import
import Gdk from "gi://Gdk";
import App from "resource:///com/github/Aylur/ags/app.js";
import Wallselect from "./modules/wallselect/main.js";
// Stuff
import userOptions from "./modules/.configuration/user_options.js";
import { config } from "./variables.js";
import {
  firstRunWelcome,
  startBatteryWarningService,
} from "./services/messages.js";
//import { startAutoDarkModeService } from "./services/darkmode.js";
// Widgets
import Bar from "./modules/bar/main.js";
import { BarCornerTopleft, BarCornerTopright } from "./modules/bar/barcorners.js";
import Cheatsheet from "./modules/cheatsheet/main.js";
import DesktopBackground from "./modules/desktopbackground/main.js";
import Dock from "./modules/dock/main.js";
import Corner from "./modules/screencorners/main.js";
import Crosshair from './modules/crosshair/main.js';
import Indicator from "./modules/indicators/main.js";
import Osk from './modules/onscreenkeyboard/main.js';
import Overview from "./modules/overview/main.js";
import Session from "./modules/session/main.js";
import SideLeft from "./modules/sideleft/main.js";
import SideRight from "./modules/sideright/main.js";
import { COMPILED_STYLE_DIR } from "./init.js";
import Ipod from "./modules/ipod/main.js";

const range = (length, start = 1) =>
  Array.from({ length }, (_, i) => i + start);
function forMonitors(widget) {
  const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
  return range(n, 0).map(widget).flat(1);
}
function forMonitorsAsync(widget) {
  const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
  return range(n, 0).forEach((n) => widget(n).catch(print));
}

// Start stuff
handleStyles(true);
// startAutoDarkModeService().catch(print);
//ssfirstRunWelcome().catch(print);
startBatteryWarningService().catch(print);

const Windows = () => {
  const modules = config.value.modules || {};
  return [
    ...(modules.desktopbackground !== false ? [DesktopBackground()] : []),
    ...(modules.crosshair === true ? [forMonitors(Crosshair)] : []), // Only enable if explicitly true
    ...(modules.overview !== false ? [Overview()] : []),
    ...(modules.indicators !== false ? [forMonitors(Indicator)] : []),
    ...(modules.cheatsheet !== false ? [forMonitors(Cheatsheet)] : []),
    ...(modules.sideleft !== false ? [SideLeft()] : []),
    ...(modules.sideright !== false ? [SideRight()] : []),
    ...(modules.onscreenkeyboard === true ? [forMonitors(Osk)] : []), // Only enable if explicitly true
    ...(modules.session !== false ? [forMonitors(Session)] : []),
    ...(modules.dock !== false ? [forMonitors(Dock)] : []),
    ...(modules.screencorners !== false && userOptions.asyncGet().appearance.fakeScreenRounding !== 0
      ? [
          forMonitors((id) => Corner(id, "top left", true)),
          forMonitors((id) => Corner(id, "top right", true)),
          forMonitors((id) => Corner(id, "bottom left", true)),
          forMonitors((id) => Corner(id, "bottom right", true)),
        ]
      : []),
      ...(modules.ipod !== false ? [Ipod()] : []),
    ...(modules.wallselect !== false ? [Wallselect()] : []),
  ];
};

const CLOSE_ANIM_TIME = 0; // Longer than actual anim time to make sure widgets animate fully
const closeWindowDelays = {}; // For animations
for (let i = 0; i < (Gdk.Display.get_default()?.get_n_monitors() || 1); i++) {
  closeWindowDelays[`osk${i}`] = CLOSE_ANIM_TIME;
}

App.config({
  css: `${COMPILED_STYLE_DIR}/style.css`,
  // stackTraceOnError: true, // Enable stack trace for debugging
  // closeWindowDelay: closeWindowDelays,
  windows: Windows().flat(1),
});

// Initialize bar only if enabled
const modules = config.value.modules || {};
if (modules.bar !== false) {
    forMonitorsAsync(Bar);
}
