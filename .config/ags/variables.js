const { Gdk, Gtk, GLib } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js'
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { exec, execAsync } = Utils;
import { init as i18n_init, getString } from './i18n/i18n.js'
//init i18n, Load language file
i18n_init()
Gtk.IconTheme.get_default().append_search_path(`${App.configDir}/assets/icons`);

// Global vars for external control (through keybinds)
export const showMusicControls = Variable(false, {})
export const showColorScheme = Variable(false, {})
globalThis['openMusicControls'] = showMusicControls;
globalThis['openColorScheme'] = showColorScheme;
globalThis['mpris'] = Mpris;
globalThis['getString'] = getString

// Initialize bar modes from config
globalThis['cycleMode'] = () => {
    const monitor = Hyprland.active.monitor.id || 0;
    const currentNum = parseInt(currentShellMode.value[monitor]) || 0;
    const nextMode = (currentNum + 1) % 5;
    updateMonitorShellMode(currentShellMode, monitor, nextMode.toString());
}

const initializeBarModes = () => {
    const configPath = GLib.get_home_dir() + '/.ags/config.json';
    const monitors = Hyprland.monitors;
    const modes = {};
    
    // Get default mode from config or use "0"
    let defaultMode = "0";
    try {
        if (GLib.file_test(configPath, GLib.FileTest.EXISTS)) {
            const config = JSON.parse(Utils.readFile(configPath));
            defaultMode = config.bar?.modes || "0";
        }
    } catch (error) {
        console.error('Error reading config:', error);
    }

    // Initialize modes for each monitor
    monitors.forEach((_, index) => {
        modes[index] = defaultMode;
    });
    
    return modes;
};

export const currentShellMode = Variable(initializeBarModes());

// Watch for monitor changes and update modes
Hyprland.connect('notify::monitors', () => {
    const currentModes = currentShellMode.value;
    const newModes = {};
    
    // Keep existing modes for current monitors
    Hyprland.monitors.forEach((_, index) => {
        newModes[index] = currentModes[index];
    });
    
    currentShellMode.value = newModes;
});

// Mode switching
export const updateMonitorShellMode = (monitorShellModes, monitor, mode) => {
    const newValue = { ...monitorShellModes.value };
    newValue[monitor] = mode;
    monitorShellModes.value = newValue;
}
globalThis['currentMode'] = currentShellMode;

// Sidebar width control
export const sidebarWidth = Variable({
    left: 350,
    right: 350,
});

export const setSidebarWidth = (side, width) => {
    const validSides = ['left', 'right'];
    if (!validSides.includes(side)) return;
    
    const window = App.getWindow(`side${side}`);
    if (!window) return;

    sidebarWidth.value = {
        ...sidebarWidth.value,
        [side]: width
    };
};

// Make functions available globally
globalThis['sidebarWidth'] = sidebarWidth;
globalThis['setSidebarWidth'] = setSidebarWidth;

// Window controls
const range = (length, start = 1) => Array.from({ length }, (_, i) => i + start);
globalThis['toggleWindowOnAllMonitors'] = (name) => {
    range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach(id => {
        App.toggleWindow(`${name}${id}`);
    });
}
globalThis['closeWindowOnAllMonitors'] = (name) => {
    range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach(id => {
        App.closeWindow(`${name}${id}`);
    });
}
globalThis['openWindowOnAllMonitors'] = (name) => {
    range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach(id => {
        App.openWindow(`${name}${id}`);
    });
}

globalThis['closeEverything'] = () => {
    const numMonitors = Gdk.Display.get_default()?.get_n_monitors() || 1;
    for (let i = 0; i < numMonitors; i++) {
        App.closeWindow(`cheatsheet${i}`);
        App.closeWindow(`session${i}`);
    }
    App.closeWindow('sideleft');
    App.closeWindow('sideright');
    App.closeWindow('overview');
};
