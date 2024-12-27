import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../.widgetutils/cursorhover.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import { initializeModules } from '../bar/modules/registry.js';
import { DockModules } from './modules.js';

let dockModules = null;

// Initialize modules
const getModules = async () => {
    if (!dockModules) {
        dockModules = await initializeModules();
    }
    return dockModules;
};

// Utility component for visual separation
export const Separator = () => Widget.Box({
    className: "txt-techfont sec-txt",
    css: "font-weight: 100;",
    child: Widget.Label({ label: " | " }),
});

// Small separator for Windows-like mode
export const SmallSeparator = () => Widget.Box({
    className: "win-separator",
    css: "min-width: 1px; background-color: rgba(255,255,255,0.2);",
});

// Start menu button for Windows-like mode
const StartButton = () => Widget.Button({
    className: 'win-start-btn',
    child: Widget.Box({
        homogeneous: true,
        className: 'win-start-icon',
        child: MaterialIcon('apps', 'norm'),
    }),
    onClicked: () => {
        App.toggleWindow('overview');
    },
    setup: setupCursorHover,
});

// Utility function to create system indicator box
const SystemIndicators = async () => {
    const modules = await getModules();
    return Widget.Box({
        className: 'system-indicators spacing-h-5',
        children: [
            modules.StatusModules.battery(),
            modules.StatusModules.system(),
            modules.StatusModules.tray(),
            modules.InfoModules.clock(),
        ],
    });
};

// Dock layout configurations for different modes
export const DockLayouts = {
    1: { // Default - Bottom center with all features
        name: 'Default',
        className: 'dock-bg spacing-h-5',
        css: 'padding: 0.5rem;',
        layout: (modules) => ({
            start: [],
            center: [
                modules.taskbar(),
                // modules.pinned(),
            ],
            end: [],
        }),
    },
    2: { // Minimal - Just icons
        name: 'Minimal',
        className: 'dock-bg-minimal spacing-h-3',
        css: 'padding: 0.3rem;',
        layout: (modules) => ({
            start: [],
            center: [
                modules.taskbar(),
                modules.pinned(),
            ],
            end: [],
        }),
    },
   
};

// Create dock content with proper layout and error handling
export const createDockContent = async (layout, modules) => {
    try {
        const { start = [], center = [], end = [] } = await layout.layout(modules);
        
        return Widget.Box({
            className: layout.className,
            css: layout.css,
            children: [
                // Start section
                Widget.Box({
                    className: 'spacing-h-5',
                    children: start,
                }),
                // Center section
                Widget.Box({
                    className: 'spacing-h-5',
                    hexpand: true,
                    halign: 'center',
                    children: center,
                }),
                // End section
                Widget.Box({
                    className: 'spacing-h-5',
                    children: end,
                }),
            ],
        });
    } catch (error) {
        console.error('Error creating dock content:', error);
        return null;
    }
};
