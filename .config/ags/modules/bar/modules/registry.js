// Module registry for easy import/export of bar modules
import Battery from "./battery.js";
import PowerDraw from "./powerdraw.js";
import SystemResources from "./resources.js";
import ResourcesBar from "./resourcesbar.js";
import System from "./system.js";
import BarToggles from "./bar_toggles.js";
import { BarButton } from "./simple_button.js";
import Shortcuts from "./utils.js";
import KbLayout from "./kb_layout.js";
import BarClock from "./clock.js";
import simpleClock from "./simple_clock.js";
import Indicators from "./spaceright.js";
import Music from "./mixed.js";
import MusicStuff from "./music.js";
import Cava from "./cava.js";
import { BarCornerTopleft, BarCornerTopright } from "../barcorners.js";
import ClassWindow from "../modules/window_title.js";
import WeatherWidget from "./weather.js";
import { Systray } from "../../systray/systray.js";
import MediaIndicator from "./media.js";
import Quote from "./quote.js";
import WaveIcon from './wave.js';
import ColorScheme from '../colorscheme.js';
import ColorPicker from "./color_picker.js";
import { changeWallpaperButton } from "./utils.js";
import Fetcher from "./fetcher.js";
import PinnedApps from "./pinned_apps.js";
import ActiveApps from "./active_apps.js";
import PowerMode from "./powermode.js";
// Cache for initialized modules
const moduleCache = new Map();

// Helper function to create async module wrapper
const createAsyncModule = (importPath, setupFn = null) => {
    return async () => {
        if (!moduleCache.has(importPath)) {
            try {
                const module = await import(importPath);
                const instance = setupFn ? await setupFn(module.default) : await module.default();
                if (instance) {
                    moduleCache.set(importPath, instance);
                }
            } catch (error) {
                console.error(`Failed to initialize module ${importPath}:`, error);
                return Widget.Box({});  // Return empty box on error
            }
        }
        return moduleCache.get(importPath);
    };
};

// Async module definitions
const asyncModules = {
    windowTitle: createAsyncModule("./spaceleft.js"),
    title: createAsyncModule("../modules/window_title.js", async (mod) => await mod()),
};

// Helper to create module wrapper that handles async results
const wrapAsyncModule = (asyncFn) => {
    return () => {
        const placeholder = Widget.Box({});
        asyncFn().then(widget => {
            if (widget) {
                placeholder.children = [widget];
            }
        }).catch(error => {
            console.error('Failed to load module:', error);
        });
        return placeholder;
    };
};

// Workspace modules are loaded dynamically based on the environment
const loadWorkspaces = async () => {
    try {
        const hyprland = await import("./uniworkspace.js");
        const hyprlandFocus = await import("./workspaces_hyprland_focus.js");
        const knoksWs = await import("./knoksws.js");
        return {
            normal: () => hyprland.default(),
            focus: () => hyprlandFocus.default(),
            knoks: () => knoksWs.default(),
        };
    } catch {
        try {
            const sway = await import("./workspaces_sway.js");
            return {
                normal: () => sway.default(),
                focus: () => sway.default(),
                knoks: () => Widget.Box({}),
            };
        } catch {
            return {
                normal: () => Widget.Box({}),
                focus: () => Widget.Box({}),
                knoks: () => Widget.Box({}),
            };
        }
    }
};

// Module groups for easier management
export const CornerModules = {
    topleft() { return BarCornerTopleft(); },
    topright() { return BarCornerTopright(); },
};

export const StatusModules = {
    battery() { return Battery(); },
    powerDraw() { return PowerDraw(); },
    systemResources() { return SystemResources(); },
    resourcesBar() { return ResourcesBar(); },
    system() { return System(); },
    tray()  {return Systray();},
    powerMode() { return PowerMode(); },
};

export const ControlModules = {
    toggles() { return BarToggles(); },
    button() { return BarButton(); },
    shortcuts() { return Shortcuts(); },
    keyboard() { return KbLayout(); },
    wallpaper: changeWallpaperButton,
};

export const InfoModules = {
    clock() { return BarClock(); },
    simpleClock() { return simpleClock(); },
    windowTitle: wrapAsyncModule(asyncModules.windowTitle),
    indicators() { return Indicators(); },
    title: wrapAsyncModule(asyncModules.title),
    statusIndicators() { return Systray(); },
    weather() { return WeatherWidget(); },
    logo(){return WaveIcon();},
    colorscheme() { return ColorScheme(); },
    colorPicker() { return ColorPicker(); },
    fetcher() { return Fetcher(); },
    quote() { 
        try {
            return Widget.Box({
                className: "bar-group-margin",
                children: [Quote()],
            });
        } catch (error) {
            console.error('Failed to create quote widget:', error);
            return null;
        }
    },
};

export const MediaModules = {
    music() { return Music(); },
    musicStuff() { return MusicStuff(); },
    cava() { return Cava(); },
    mediaIndicator() { return MediaIndicator(); },
};

export const AppModules = {
    pinnedApps() { return PinnedApps(); },
    activeApps() { return ActiveApps(); },
};

// Initialize all async modules
const initializeAsyncModules = async () => {
    await Promise.all(Object.values(asyncModules).map(fn => fn()));
};

// Function to initialize all modules
export const initializeModules = async () => {
    await initializeAsyncModules();
    const workspaces = await loadWorkspaces();
    
    return {
        workspaces,
        CornerModules,
        StatusModules,
        ControlModules,
        InfoModules,
        MediaModules,
        AppModules,
    };
};

export default {
    workspaces: () => loadWorkspaces(),
    CornerModules,
    StatusModules,
    ControlModules,
    InfoModules,
    MediaModules,
    AppModules,
};
