// Layout definitions for different bar modes
import Widget from "resource:///com/github/Aylur/ags/widget.js";

// Utility component for visual separation
export const Separator = () => Widget.Box({
    className: "txt-hugerass sec-txt",
    css:"font-weight:100;",
    child: Widget.Label({ label: "| " }),
});

export const Dent = () => Widget.Box({});

// Bar layout configurations for different modes
export const BarLayouts = {
    1: { // Pads
        name: 'Pads',
        className: 'bar-nothing',
        corners: {
            topLeft: true,
            topRight: true,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules, monitor) => ({
            start: [
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.StatusModules.battery(),
                        modules.workspaces.normal(),
                    ],
                }),
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.ControlModules.shortcuts(),
                    ],
                })
            ],
            center: [Widget.Box({
                className: 'bar-round-padding',
                children: [
                    modules.InfoModules.clock(),
                ],
            }),Widget.Box({
                className: 'bar-round-padding',
                children: [
                    modules.MediaModules.cava(),
                ],
            })],
            end: [
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.InfoModules.weather(),
                    ],
                }),
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.StatusModules.tray(),
                    ],
                }),
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.StatusModules.systemResources(),
                    ],
                }),
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.InfoModules.indicators(),
                    ],
                }),
                modules.ControlModules.button(),
            ],
        }),
    },
    4: { // Floating
        name: 'Floating',
        className: 'bar-floating spacing-h-15',
        css: "min-height:3.2rem",
        corners: {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules) => ({
            start: [
                modules.workspaces.focus(),
            ],
            center: [
                modules.InfoModules.clock(),
            ],
            end: [
                Separator(),
                modules.InfoModules.indicators(),
                modules.StatusModules.battery(),
            ],
        }),
    },
    2: { // Short
        name: 'Short',
        className: 'bar-floating-short',
        css: "min-height:3.2rem",
        corners: {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules) => ({
            start: [
                modules.workspaces.focus(),
            ],
            center: [
                modules.InfoModules.clock(),
            ],
            end: [
                modules.InfoModules.indicators(),
                modules.StatusModules.battery(),
            ],
        }),
    },
    3: { // Shorter
        name: 'Shorter',
        className: 'bar-floating-shorter',
        css: "min-height:3.2rem",
        corners: {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules) => ({
            start: [
                modules.StatusModules.battery(),
                Separator(),
                modules.ControlModules.shortcuts(),
            ],
            center: [
                modules.workspaces.focus(),
            ],
            end: [
                modules.InfoModules.indicators(),
                modules.InfoModules.simpleClock({className:"icon-nerd sec-txt",}),
            ],
        }),
    },
    5: { // Normal
        name: 'Normal',
        number: 1,
        className: 'bar-bg',
        corners: {
            topLeft: true,
            topRight: true,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules) => ({
            start: [
                modules.CornerModules.topleft(),
                modules.InfoModules.windowTitle(),
            ],
            center: [
                modules.MediaModules.music(),
                modules.workspaces.normal(),
                modules.StatusModules.system(),
            ],
            end: [
                modules.InfoModules.indicators(),
                modules.CornerModules.topright(),
            ],
        }),
    },
    6: { // floatnorm
        name: 'Minimal',
        className: 'bar-floating-short',
        css:"min-height:2.8rem",
        corners: {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules) => ({
            start: [
                modules.InfoModules.title(),
            ],
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
export const createBarContent = async (layout, modules, monitor) => {
    try {
        const config = await layout.layout(modules, monitor);
        
        // Create boxes for each section
        const startBox = Widget.Box({
            className: 'bar-start spacing-h-5',
            hpack: 'start',
        });

        const centerBox = Widget.Box({
            className: 'bar-center spacing-h-5',
            hpack: 'center',
        });

        const endBox = Widget.Box({
            className: 'bar-end spacing-h-5',
            hpack: 'end',
        });

        // Set children after box creation to avoid widget reuse issues
        startBox.children = config.start?.filter(Boolean) || [];
        centerBox.children = config.center?.filter(Boolean) || [];
        endBox.children = config.end?.filter(Boolean) || [];

        // Dynamically handle corner rendering
        const corners = layout.corners || {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
        };

        // Add corner modules dynamically if they exist and are enabled
        if (corners.topLeft && modules.CornerModules?.topleft) {
            startBox.children.unshift(modules.CornerModules.topleft());
        }
        if (corners.topRight && modules.CornerModules?.topright) {
            endBox.children.push(modules.CornerModules.topright());
        }

        const content = Widget.Box({
            className: layout.className || '',
            css: layout.css || '',
            child: Widget.CenterBox({
                className: 'bar-content',
                startWidget: startBox,
                centerWidget: centerBox,
                endWidget: endBox,
            }),
        });

        return content;
    } catch (error) {
        console.error('Error creating bar content:', error);
        return Widget.Box(); // Return an empty box in case of error
    }
};
 