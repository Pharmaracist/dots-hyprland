const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { currentShellMode } from "../../variables.js";

// Import modular components
import { BarLayouts, createBarContent } from "./layouts/index.js";
import { initializeModules } from "./modules/registry.js";

// Create different bar contents
const createBarContents = async (monitor) => {
    const modules = await initializeModules();
    const contents = {};

    // Create content for each mode
    for (const mode of [1, 2, 3, 4, 5, 6, 7, 8, 9]) { // Normal, Floating, Minimal
        try {
            const layout = BarLayouts[mode];
            if (layout) {
                const content = await createBarContent(layout, modules);
                if (content) {
                    contents[`mode${mode}`] = content;
                }
            }
        } catch (error) {
            console.error(`Failed to create content for mode ${mode}:`, error);
        }
    }

    return contents;
};

// Create the bar window
const createBar = async (monitor = 0) => {
    const contents = await createBarContents(monitor);
    const options = globalThis.userOptions?.asyncGet?.() || {};

    // Default to mode1 if no contents are available
    if (!contents.mode1) {
        console.error('Failed to create default bar content');
        return null;
    }

    const stack = Widget.Stack({
        homogeneous: false,
        transition: "slide_up_down",
        transitionDuration: options.animations?.durationSmall || 60,
        children: contents,
    });

    const bar = Widget.Window({
        name: `bar-${monitor}`,
        anchor: [userOptions.asyncGet().bar.position, 'left', 'right'],
        exclusivity: "exclusive",
        visible: true,
        child: Widget.Box({
            css: 'min-height: 3rem;',
            children: [stack],
        }),
    });

    // Set up mode switching
    currentShellMode.connect('changed', () => {
        const mode = currentShellMode.value?.[monitor] || 1;
        const modeKey = `mode${mode}`;
        if (contents[modeKey]) {
            stack.shown = modeKey;
        }
    });

    // Set initial mode
    const initialMode = currentShellMode.value?.[monitor] || 1;
    stack.shown = `mode${initialMode}`;

    return bar;
};

export default async function Bar(monitor = 0) {
    return createBar(monitor);
}