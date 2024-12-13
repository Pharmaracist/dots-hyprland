// Layout definitions for different bar modes
import Widget from "resource:///com/github/Aylur/ags/widget.js";

// Utility component for visual separation
export const Separator = () => Widget.Box({
    className: "txt-hugerass sec-txt",
    css:"font-weight:100;",
    child: Widget.Label({ label: "| " }),
});
export const Dent = () => Widget.Box({
    // css:"mind-width:2rem;",
    className:'margin-rl-5',
    child: Widget.Label({ label: "   " }),
});
// Bar layout configurations for different modes
export const BarLayouts = {
    1: { // Floating
        name: 'Pads',
        className: 'bar-nothing',
        layout:  (modules) => ({
            start: [Widget.Box({
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
            }),
        ],
        center: [Widget.Box({
            className: 'bar-round-padding',
            children: [
                modules.InfoModules.clock(),
                modules.MediaModules.cava(),
            ],
        })],
            end: [
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
        layout:  (modules) => ({
            start: [
                modules.workspaces.focus(),
                Dent(),
                modules.ControlModules.shortcuts(),
            ],
            center: [
                modules.InfoModules.clock(),
                modules.MediaModules.cava(),
            ],
            end: [
                modules.InfoModules.indicators(),
                modules.StatusModules.battery(),
            ],
        }),
    },
    2: { // Floating
        name: 'Short',
        className: 'bar-floating-short',
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
                modules.StatusModules.battery(),

            ],
        }),
    },
    3: { // Floating
        name: 'Shorter',
        className: 'bar-floating-shorter',
        css: "min-height:3.2rem",
        layout:  (modules) => ({
            start: [
                
                modules.StatusModules.battery(),
               
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
        className: 'bar-bg',
        layout: (modules) => ({
            start: [modules.InfoModules.windowTitle()],
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
    6: { //floatnorm
        name: 'Minimal',
        className: 'bar-floating-short',
        css:"min-height:2.8rem",
        layout: (modules) => ({
            start: [modules.InfoModules.title()],
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
export const createBarContent = async (layout, modules) => {
    try {
        const config = layout.layout(modules);
        const content = Widget.Box({
            className: layout.className || '',
            css: layout.css || '',
            children: [
                Widget.CenterBox({
                    className: 'bar-content',
                    startWidget: Widget.Box({
                        className: 'bar-start spacing-h-15',
                        hpack: 'start',
                        children: config.start?.filter(Boolean) || [],
                    }),
                    centerWidget: Widget.Box({
                        className: 'bar-center spacing-h-15',
                        hpack: 'center',
                        children: config.center?.filter(Boolean) || [],
                    }),
                    endWidget: Widget.Box({
                        className: 'bar-end spacing-h-15',
                        hpack: 'end',
                        children: config.end?.filter(Boolean) || [],
                    }),
                }),
            ],
           
        });

        return content;
    } catch (error) {
        console.error(`Error creating bar content for layout ${layout.name}:`, error);
        return Widget.Box({ 
            className: "bar-error",
            child: Widget.Label({ label: `Error: ${error.message}` }),
        });
    }
};