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
import Indicators from "./spaceright.js";
import Music from "./mixed.js";
import MusicStuff from "./music.js";
import Cava from "./cava.js";
import { BarCornerTopleft, BarCornerTopright } from "../barcorners.js";
import ClassWindow from "../modules/window_title.js";

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
        const hyprland = await import("./workspaces_hyprland.js");
        const hyprlandFocus = await import("./workspaces_hyprland_focus.js");
        return {
            normal: () => hyprland.default(),
            focus: () => hyprlandFocus.default(),
        };
    } catch {
        try {
            const sway = await import("./workspaces_sway.js");
            return {
                normal: () => sway.default(),
                focus: () => sway.default(),
            };
        } catch {
            return {
                normal: () => Widget.Box({}),
                focus: () => Widget.Box({}),
            };
        }
    }
};

// Helper function to determine if a layout should have corners
const shouldHaveCorners = (layoutNumber) => {
    // List of layout numbers that should have corners
    const cornerLayouts = [5]; // Only the Normal layout (5) should have corners
    
    // Return true if the layout number is in the list
    return cornerLayouts.includes(layoutNumber);
};

// Module groups for easier management
export const CornerModules = {
    async topleft(layout) {
        return shouldHaveCorners(layout?.number) ? await BarCornerTopleft() : null;
    },
    async topright(layout) {
        return shouldHaveCorners(layout?.number) ? await BarCornerTopright() : null;
    },
};

export const StatusModules = {
    battery() { return Battery(); },
    powerDraw() { return PowerDraw(); },
    systemResources() { return SystemResources(); },
    system() { return System(); },
};

export const ControlModules = {
    toggles() { return BarToggles(); },
    button() { return BarButton(); },
    shortcuts() { return Shortcuts(); },
    keyboard() { return KbLayout(); },
};

export const InfoModules = {
    clock() { return BarClock(); },
    simpleClock() { return simpleClock(); },
    windowTitle: wrapAsyncModule(asyncModules.windowTitle),
    indicators() { return Indicators(); },
    title: wrapAsyncModule(asyncModules.title),
    statusIndicators() { return System(); },
};

export const MediaModules = {
    music() { return Music(); },
    musicStuff() { return MusicStuff(); },
    cava() { return Cava(); },
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
    };
};