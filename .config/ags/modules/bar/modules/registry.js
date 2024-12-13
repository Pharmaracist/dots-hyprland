// Module registry for easy import/export of bar modules
import Battery from "./battery.js";
import PowerDraw from "./powerdraw.js";
import SystemResources from "./resources.js";
import System from "./system.js";
import BarToggles from "./bar_toggles.js";
import { BarButton } from "./simple_button.js";
import Shortcuts from "./utils.js";
import KbLayout from "./kb_layout.js";
import BarClock from "./clock.js";
import simpleClock from "./simple_clock.js";
import WindowTitle from "./spaceleft.js";
import Indicators from "./spaceright.js";
import Music from "./mixed.js";
import MusicStuff from "./music.js";
import Cava from "./cava.js";
import { BarCornerTopleft, BarCornerTopright } from "../barcorners.js";
import ClassWindow from "../modules/window_title.js";

// Cache for initialized modules
// const moduleCache = new Map();

// Async module initializers with caching
// const asyncModules = {
//     windowTitle: async () => {
//         if (!moduleCache.has('windowTitle')) {
//             moduleCache.set('windowTitle', await WindowTitle());
//         }
//         return moduleCache.get('windowTitle');
//     },
//     title: async () => {
//         if (!moduleCache.has('title')) {
//             moduleCache.set('title', await ClassWindow());
//         }
//         return moduleCache.get('title');
//     },
// };

// Workspace modules are loaded dynamically based on the environment
const loadWorkspaces = async () => {
    try {
        const hyprland = await import("./workspaces_hyprland.js");
        const hyprlandFocus = await import("./workspaces_hyprland_focus.js");
        return {
            normal: () => hyprland.default(),
            focus: () => hyprlandFocus.default(),
        };
    } catch {
        try {
            const sway = await import("./workspaces_sway.js");
            const swayFocus = await import("./workspaces_sway_focus.js");
            return {
                normal: () => sway.default(),
                focus: () => swayFocus.default(),
            };
        } catch {
            return { 
                normal: () => null,
                focus: () => null,
            };
        }
    }
};

// Module groups for easier management
export const CornerModules = {
    topleft: () => BarCornerTopleft(),
    topright: () => BarCornerTopright(),
};

export const StatusModules = {
    battery: () => Battery(),
    powerDraw: () => PowerDraw(),
    systemResources: () => SystemResources(),
    system: () => System(),
};

export const ControlModules = {
    toggles: () => BarToggles(),
    button: () => BarButton(),
    shortcuts: () => Shortcuts(),
    keyboard: () => KbLayout(),
};

export const InfoModules = {
    clock: () => BarClock(),
    simpleClock: () => simpleClock(),
    windowTitle: () => WindowTitle(),
    indicators: () => Indicators(),
    title: () => ClassWindow(),
};

export const MediaModules = {
    music: () => Music(),
    musicStuff: () => MusicStuff(),
    cava: () => Cava(),
};

// Initialize all async modules
// const initializeAsyncModules = async () => {
//     await Promise.all(Object.values(asyncModules).map(fn => fn()));
// };

// Function to initialize all modules
export const initializeModules = async () => {
    const workspaces = await loadWorkspaces();
    // await initializeAsyncModules();
    return {
        workspaces,
        CornerModules,
        StatusModules,
        ControlModules,
        InfoModules,
        MediaModules,
    };
};