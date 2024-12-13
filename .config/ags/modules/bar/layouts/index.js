// Layout definitions for different bar modes
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import ClassWindow from "../modules/window_title.js";

// Utility component for visual separation
export const Separator = () => Widget.Box({
    className: "txt-huge sec-txt margin-rl-10",
    child: Widget.Label({ label: "|" }),
});

// Bar layout configurations for different modes
export const BarLayouts = {
    1: { // Floating
        name: 'Floating',
        className: 'bar-floating',
        css: "min-height:3.2rem",
        layout:  (modules) => ({
            start: [
                modules.workspaces.focus(),
            ],
            center: [
                modules.InfoModules.clock(),
            ],
            end: [
                modules.InfoModules.indicators(),
            ],
        }),
    },
    2: { // Notch
        name: 'Notch',
        className: 'bar-nothing',
        layout: (modules) => ({
            // start: [modules.InfoModules.windowTitle()],
            center: [Widget.Box({
                className: "bar-notch spacing-h-5",
                css: "min-height:3.3rem",
                children: [
                    modules.MediaModules.music(),
                    modules.workspaces.normal(),
                    modules.StatusModules.system(),
                ]
            })],
            end: [
                modules.InfoModules.indicators(),
            ],
        }),
    },
    3: { // Normal
        name: 'Normal',
        className: 'bar-bg spacing-h-5',
        layout: (modules) => ({
            // start: [modules.InfoModules.title()],
            center: [
                modules.MediaModules.music(),
                modules.workspaces.normal(),
                modules.StatusModules.system(),
            ],
            end: [
                modules.InfoModules.indicators(),
            ],
        }),
    },
};

// Create bar content with proper layout and error handling
export const createBarContent = (layout, modules) => {
    try {
        const config = layout.layout(modules);
        return Widget.Box({
            className: layout.className || 'bar-bg',
            css: layout.css || '',
            children: [
                Widget.CenterBox({
                    className: 'bar-content',
                    startWidget: Widget.Box({
                        className: 'bar-start',
                        hpack: 'start',
                        children: config.start?.filter(Boolean) || [],
                    }),
                    centerWidget: Widget.Box({
                        className: 'bar-center',
                        hpack: 'center',
                        children: config.center?.filter(Boolean) || [],
                    }),
                    endWidget: Widget.Box({
                        className: 'bar-end',
                        hpack: 'end',
                        children: config.end?.filter(Boolean) || [],
                    }),
                }),
            ],
        });
    } catch (error) {
        console.error(`Error creating bar content for layout ${layout.name}:`, error);
        return Widget.Box({ 
            className: "bar-error",
            child: Widget.Label({ label: `Error: ${error.message}` }),
        });
    }
};