const { Gdk, Gtk } = imports.gi;
import App from "resource:///com/github/Aylur/ags/app.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Variable from "resource:///com/github/Aylur/ags/variable.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { exec, execAsync } = Utils;
import { init as i18n_init, getString } from "./i18n/i18n.js";
import userOptions from "./modules/.configuration/user_options.js";
import GLib from 'gi://GLib';

//init i18n, Load language file
i18n_init();
Gtk.IconTheme.get_default().append_search_path(`${App.configDir}/assets/icons`);

// Module management
const CONFIG_PATH = `${GLib.get_home_dir()}/.ags/config.json`;

// Initialize or load config
const initializeConfig = () => {
    try {
        if (Utils.readFile(CONFIG_PATH)) {
            const config = JSON.parse(Utils.readFile(CONFIG_PATH));
            if (!config.modules) {
                config.modules = {
                    // Core UI
                    bar: true,
                    dock: true,
                    sideleft: true,
                    sideright: true,
                    
                    // Overlays and Utilities
                    overview: true,
                    cheatsheet: true,
                    indicators: true,
                    osd: true,
                    powermenu: true,
                    settings: true,
                    session: true,
                    
                    // Visual Elements
                    colorscheme: true,
                    screencorners: true,
                    desktopbackground: true,
                    wallselect: true,
                    
                    // Additional Features
                    onscreenkeyboard: true,
                    crosshair: true,
                    notifications: true,
                    weather: true,
                    system: true,
                    media: true,
                    clock: true,
                    workspaces: true,
                    tray: true,
                    battery: true,
                    network: true,
                    volume: true,
                    keyboard: true,
                };
                Utils.writeFile(JSON.stringify(config, null, 2), CONFIG_PATH).catch(print);
            }
            return config;
        }
    } catch (error) {
        print('Error reading config:', error);
    }
    return {};
};

// Create a Variable for the entire config
export const config = Variable(initializeConfig(), {});

// Save configuration and reload AGS
const saveConfig = () => {
    Utils.writeFile(JSON.stringify(config.value, null, 2), CONFIG_PATH)
        .then(() => {
            // Reload widgets
            App.resetWidgets();
        })
        .catch(print);
};

// Function to toggle module state
globalThis["toggleModule"] = (module) => {
    if (!config.value.modules) {
        config.value.modules = {};
    }
    
    if (module in config.value.modules) {
        const newState = !config.value.modules[module];
        config.value = {
            ...config.value,
            modules: {
                ...config.value.modules,
                [module]: newState
            }
        };
        execAsync(['notify-send', `Module: ${module}`, 
            `${newState ? 'Enabling' : 'Disabling'} ${module}...`])
            .catch(print);
        
        // Save and reload
        saveConfig();
        
        // For certain modules that need immediate visual update
        if (['wallselect', 'indicators', 'screencorners', 'desktopbackground'].includes(module)) {
            App.resetWidgets();
        }
    } else {
        execAsync(['notify-send', 'Error', `Module "${module}" not found`])
            .catch(print);
    }
};

// Function to list all modules and their states
globalThis["listModules"] = () => {
    if (!config.value.modules) {
        execAsync(['notify-send', 'Module States', 'No modules configured']).catch(print);
        return;
    }
    const moduleList = Object.entries(config.value.modules)
        .map(([name, enabled]) => `${name}: ${enabled ? 'enabled' : 'disabled'}`)
        .join('\n');
    execAsync(['notify-send', 'Module States', moduleList])
        .catch(print);
};

// Check if a module is enabled
export const isModuleEnabled = (module) => {
    return config.value.modules?.[module] ?? true; // Default to true if not specified
};

// Global vars for external control (through keybinds)
export const showMusicControls = Variable(false, {});
export const showColorScheme = Variable(false, {});
globalThis["openMusicControls"] = showMusicControls;
globalThis["openColorScheme"] = showColorScheme;
globalThis["mpris"] = Mpris;
globalThis["getString"] = getString;

// load monitor shell modes from userOptions
const initialMonitorShellModes = () => {
  const numberOfMonitors = Gdk.Display.get_default()?.get_n_monitors() || 1;
  let defaultMode = 1;
  try {
    const config = JSON.parse(Utils.readFile(GLib.get_home_dir() + '/.ags/config.json'));
    defaultMode = config.defaultBarMode || 1;
  } catch (e) {
    console.log('Failed to read default bar mode:', e);
  }
  const monitorBarConfigs = [];
  for (let i = 0; i < numberOfMonitors; i++) {
    monitorBarConfigs.push(defaultMode); // Use the default mode from config
  }
  return monitorBarConfigs;
};

export const currentShellMode = Variable(initialMonitorShellModes(), {});

// Mode switching
const updateMonitorShellMode = (monitorShellModes, monitor, mode) => {
  const newValue = [...monitorShellModes.value];
  newValue[monitor] = mode;
  monitorShellModes.value = newValue;
};

globalThis["currentMode"] = currentShellMode;
globalThis["cycleMode"] = () => {
  const monitor = Hyprland.active.monitor.id || 0;
  const currentMode = currentShellMode.value[monitor];
  
  // Cycle through modes 1-6
  const nextMode = (currentMode % 4) + 1;
  updateMonitorShellMode(currentShellMode, monitor, nextMode);
};

// Window controls
const range = (length, start = 1) =>
  Array.from({ length }, (_, i) => i + start);
globalThis["toggleWindowOnAllMonitors"] = (name) => {
  range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach((id) => {
    App.toggleWindow(`${name}${id}`);
  });
};
globalThis["closeWindowOnAllMonitors"] = (name) => {
  range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach((id) => {
    App.closeWindow(`${name}${id}`);
  });
};
globalThis["openWindowOnAllMonitors"] = (name) => {
  range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach((id) => {
    App.openWindow(`${name}${id}`);
  });
};

globalThis["closeEverything"] = () => {
  const numMonitors = Gdk.Display.get_default()?.get_n_monitors() || 1;
  for (let i = 0; i < numMonitors; i++) {
    App.closeWindow(`cheatsheet${i}`);
    App.closeWindow(`session${i}`);
  }
  App.closeWindow("sideleft");
  App.closeWindow("sideright");
  App.closeWindow("overview");
};

// Function to apply a preset
globalThis["applyPreset"] = (presetName) => {
    if (!config.value.presets || !(presetName in config.value.presets)) {
        execAsync(['notify-send', 'Error', `Preset "${presetName}" not found`])
            .catch(print);
        return;
    }
    
    const preset = config.value.presets[presetName];
    config.value = {
        ...config.value,
        modules: {
            ...config.value.modules,
            ...preset
        }
    };
    
    execAsync(['notify-send', `Preset: ${presetName}`, 
        `Applying ${presetName} preset...`])
        .catch(print);
    
    // Save and reload
    saveConfig();
    App.resetWidgets();
};

// Module presets
const PRESETS = {
    'minimal': {
        name: 'Minimal',
        description: 'Only essential modules',
        modules: {
            bar: true,
            sideleft: false,
            sideright: false,
            dock: false,
            overview: true,
            indicators: true,
            cheatsheet: false,
            session: true,
            screencorners: false,
            desktopbackground: true,
            wallselect: false,
            onscreenkeyboard: false,
            crosshair: false,
        },
    },
    'gaming': {
        name: 'Gaming',
        description: 'Optimized for gaming sessions',
        modules: {
            bar: true,
            sideleft: false,
            sideright: false,
            dock: false,
            overview: false,
            indicators: true,
            cheatsheet: false,
            session: true,
            screencorners: false,
            desktopbackground: true,
            wallselect: false,
            onscreenkeyboard: false,
            crosshair: true,
        },
    },
    'full': {
        name: 'Full',
        description: 'All modules enabled',
        modules: {
            bar: true,
            sideleft: true,
            sideright: true,
            dock: true,
            overview: true,
            indicators: true,
            cheatsheet: true,
            session: true,
            screencorners: true,
            desktopbackground: true,
            wallselect: true,
            onscreenkeyboard: true,
            crosshair: true,
        },
    },
};

// Function to list available presets
globalThis["listPresets"] = () => {
    const presetList = Object.entries(PRESETS)
        .map(([key, preset]) => `${preset.name} (${key})\n${preset.description}`)
        .join('\n\n');
    execAsync(['notify-send', 'Available Presets', presetList])
        .catch(print);
};
