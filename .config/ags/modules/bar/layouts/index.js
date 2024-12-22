// Layout definitions for different bar modes
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import ScrollableContainer from '../modules/scrollable.js';

// Utility component for visual separation
export const Separator = () => Widget.Box({
    className: "txt-hugerass sec-txt",
    css:"font-weight:100;",
    child: Widget.Label({ label: "| " }),
});

export const Dent = () => Widget.Box({});

// Bar layout configurations for different modes
export const BarLayouts = {
    1: {
        name: 'Pads',
        css: 'min-height:4rem',
        layout: (modules, monitor) => ({
            start: [
                Widget.Box({
                    className: 'bar-round-padding spacing-h-15',
                    children: [modules.StatusModules.battery(), modules.workspaces.normal()],
                }),
                Widget.Box({ 
                    className: 'bar-round-padding', 
                    children: [modules.ControlModules.shortcuts()], 
                })
            ],
            center: [
               Widget.Box({
                children:[
                ScrollableContainer({
                    name: 'shortchuts',
                    sets: [
                        Widget.Box({
                            css: 'min-width:7.5rem;',
                            className: 'bar-round-padding spacing-h-15',
                            children: [
                                Widget.Box({ 
                                    className: 'bar-round-padding spacing-h-15',
                                    children: [modules.ControlModules.shortcuts()],
                                }),
                            ]
                        }),
                        Widget.Box({
                            css: 'min-width:7.5rem;',
                            className: 'bar-round-padding spacing-h-15',
                            children: [
                                Widget.Box({
                                    hexpand: true,
                                    hpack: 'center',
                                    children: [modules.ControlModules.shortcuts()],
                                })
                            ],
                        }),
                    ],
                }),
            ]}),
            ],
            end: [
                Widget.Box({ className: 'bar-round-padding', children: [modules.StatusModules.tray(),], }),
                Widget.Box({className: 'bar-round-padding spacing-h-15', children: [modules.InfoModules.weather()] }),
                Widget.Box({className: 'bar-round-padding', children: [modules.InfoModules.indicators()] })
                ,modules.ControlModules.button()],
        }),
    },
    2: { 
        name: 'Knocks',
        layout: (modules) => ({
            start: [
                Widget.Box({
                    className: 'start-widget',
                    homogeneous: true,
                    css: 'margin-right: 0.5rem;',
                    children: [modules.InfoModules.windowTitle()],
                }),
               
            ],
            center: [
                ScrollableContainer({
                    name: 'system',
                    sets: [
                        [Widget.Box({
                            css:`min-width:30rem;`,
                            className: 'spacing-h-15 bar-knocks padding-rl-15',
                            children: [modules.MediaModules.musicStuff()],
                        })],
                        [Widget.Box({
                            css:`min-width:30rem;`,
                            className: 'bar-knocks spacing-h-15 padding-rl-15',
                            children: [modules.InfoModules.logo(), modules.InfoModules.quote()],
                        })],
                        [Widget.Box({
                            css:`min-width:30rem;`,
                            className: 'bar-knocks spacing-h-15',
                            children: [
                                Widget.Box({
                                    className: 'spacing-h-5 padding-rl-15',
                                    children: [
                                        modules.ControlModules.wallpaper(),
                                        modules.InfoModules.colorscheme()
                                    ]
                                })
                            ],
                        })],
                    ],
                }),
                Widget.Box({
                    className: 'bar-knocks padding-rl-15',
                    children: [modules.workspaces.normal()],
                }),                
                ScrollableContainer({
                    name: 'system',
                    sets: [
                        [Widget.Box({
                            css:`min-width:30rem;`,
                            className: 'spacing-h-15 bar-knocks padding-rl-15',
                            children: [
                                modules.InfoModules.simpleClock(),
                                modules.ControlModules.keyboard(),
                                modules.InfoModules.indicators(),
                                modules.StatusModules.resourcesBar(),
                                Widget.Box({ className: 'padding-rl-10',child: modules.StatusModules.battery() }),
                            ]
                        })],
                        [Widget.Box({
                            css:`min-width:30rem; padding-right: 2rem;`,
                            className: 'bar-knocks spacing-h-15',
                            children: [Widget.Box({hexpand: true,hpack: 'center',children:[ modules.InfoModules.colorscheme() ]}), modules.ControlModules.wallpaper()],
                        })],
                    ],
                }),
             
            ],
            end: [
            ],
        }),
    },
    3: { 
        name: 'Minimal',
        className: 'bar-bg',
        layout: (modules) => ({
            start: [
                modules.CornerModules.topleft(),
                Widget.Box({
                    className: 'spacing-h-15 start-widget',
                    css:`margin-right: 1rem;`,
                    children: [
                        modules.StatusModules.battery(),
                    ],
                }),
                modules.workspaces.normal(),
            ],
            center: [
                    modules.InfoModules.clock(),
            
            ],
            end: [
                Widget.Box({
                    children: [
                        modules.StatusModules.tray(),
                    ],
                }),
                modules.InfoModules.indicators(),
                modules.ControlModules.button(),
                modules.CornerModules.topright(),
            ],
        }),
    },
    4: {
        name: 'Floating',
        className: 'bar-floating spacing-h-15',
        css: "min-height:2.65rem margin-top: 0.5rem;",
        layout: (modules) => ({
            start: [
                modules.StatusModules.battery(),
                modules.workspaces.normal(),
            ],
            center: [
                modules.MediaModules.mediaIndicator(),],
            end: [
                Widget.Box({
                    children: [
                        modules.InfoModules.indicators(),
                    ],
                }),
            ],
        }),
    },
    5: {
        name: 'Short',
        className: 'bar-floating-short',
        css: "min-height:2.8rem",
        layout: (modules) => ({
            start: [
                modules.InfoModules.simpleClock(),
                modules.workspaces.normal(),
            ],
            center: [
                modules.InfoModules.weather(),
            ],
            end: [
                modules.InfoModules.indicators(),
                modules.StatusModules.battery(),
            ],
        }),
    },
    6: { 
        name: 'Shorter',
        layout: (modules) => ({
            start: [
                Widget.Box({
                    className: 'start-widget',
                    children: [
                        modules.StatusModules.battery(),
                    ],
                }),
            ],
            center: [
                Widget.Box({
                    className: 'bar-notch spacing-h-15',
                    css: "min-height:3rem;padding: 0.4rem 1.2rem;",
                    hpack: 'center',
                    hexpand: true,
                    children: [
                        modules.workspaces.normal(),
                    ],
                }),
            ],
            end: [
                Widget.Box({
                    className: 'end-widget',
                    children: [
                        modules.InfoModules.indicators(),
                    ],
                }),
            ],
        }),
    },
    7: { // Normal
        name: 'Normal',
        className: 'bar-bg',
        corners: {
            topLeft: true,
            topRight: true,
            bottomLeft: false,
            bottomRight: false,
        },
        layout: (modules) => ({
            start: [
                modules.InfoModules.windowTitle(),
            ],
            center: [
                modules.InfoModules.clock(),
            ],
            end: [
                modules.StatusModules.battery(),
                modules.StatusModules.system(),
            ],
        }),
    },
    8: { // floatnorm
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
    // 9: { // Scrollable
    //     name: 'Scrollable',
    //     className: 'bar-scrollable',
    //     layout: (modules) => {
    //         const ModuleSet1 = [
    //             modules.InfoModules.simpleClock(),
    //             modules.ControlModules.keyboard(),
    //             modules.InfoModules.indicators(),
    //             modules.StatusModules.battery(),
    //         ];

    //         const ModuleSet2 = [
    //             modules.InfoModules.quote(),

    //         ];

    //         return {
    //             start: [],
    //             center: [
    //                 ScrollableContainer({
    //                     sets: [ModuleSet1, ModuleSet2],
    //                 }),
    //             ],
    //             end: [],
    //         };
    //     },
    // },
};

// Create bar content with proper layout and error handling
export const createBarContent = async (layout, modules, monitor) => {
    try {
        const config = await layout.layout(modules, monitor);
        
        // Helper function to safely create a widget
        const createWidget = (factory) => {
            try {
                if (typeof factory === 'function') {
                    return factory();
                }
                return factory;
            } catch (error) {
                console.error('Error creating widget:', error);
                return null;
            }
        };

        // Helper function to safely add widgets to a container
        const addWidgets = (container, widgets = []) => {
            const children = [];
            widgets.filter(Boolean).forEach(widget => {
                const newWidget = createWidget(widget);
                if (newWidget) {
                    // If widget has a parent, create a new instance instead
                    if (newWidget.parent) {
                        try {
                            const clone = newWidget.constructor();
                            if (clone.setup) {
                                clone.setup(clone);
                            }
                            children.push(clone);
                        } catch (error) {
                            console.error('Error cloning widget:', error);
                        }
                    } else {
                        children.push(newWidget);
                    }
                }
            });

            // Remove existing children first
            container.children = [];

            // Then add new children
            container.children = children;
            return children;
        };

        // Create boxes for each section
        const startBox = Widget.Box({
            className: 'bar-start spacing-h-5',
            hpack: 'start',
            setup: self => {
                self.connect('destroy', () => {
                    (self.children || []).forEach(child => {
                        if (child?.destroy) {
                            try {
                                child.destroy();
                            } catch (error) {
                                console.error('Error destroying child:', error);
                            }
                        }
                    });
                });
            },
        });

        const centerBox = Widget.Box({
            className: 'bar-center spacing-h-5',
            hpack: 'center',
            setup: self => {
                self.connect('destroy', () => {
                    (self.children || []).forEach(child => {
                        if (child?.destroy) {
                            try {
                                child.destroy();
                            } catch (error) {
                                console.error('Error destroying child:', error);
                            }
                        }
                    });
                });
            },
        });

        const endBox = Widget.Box({
            className: 'bar-end spacing-h-5',
            hpack: 'end',
            setup: self => {
                self.connect('destroy', () => {
                    (self.children || []).forEach(child => {
                        if (child?.destroy) {
                            try {
                                child.destroy();
                            } catch (error) {
                                console.error('Error destroying child:', error);
                            }
                        }
                    });
                });
            },
        });

        // Add widgets to each section
        const startWidgets = [];
        const centerWidgets = [];
        const endWidgets = [];

        // Add corner modules if needed
        const corners = layout.corners || {
            topLeft: false,
            topRight: false,
            bottomLeft: false,
            bottomRight: false,
        };

        if (corners.topLeft && modules.CornerModules?.topleft) {
            const corner = createWidget(modules.CornerModules.topleft);
            if (corner) startWidgets.push(corner);
        }

        // Add regular widgets
        if (config.start) startWidgets.push(...config.start);
        if (config.center) centerWidgets.push(...config.center);
        if (config.end) endWidgets.push(...config.end);

        if (corners.topRight && modules.CornerModules?.topright) {
            const corner = createWidget(modules.CornerModules.topright);
            if (corner) endWidgets.push(corner);
        }

        // Add widgets to containers
        const addedStart = addWidgets(startBox, startWidgets);
        const addedCenter = addWidgets(centerBox, centerWidgets);
        const addedEnd = addWidgets(endBox, endWidgets);

        const content = Widget.Box({
            className: layout.className || '',
            css: layout.css || '',
            child: Widget.CenterBox({
                className: 'bar-content',
                startWidget: startBox,
                centerWidget: centerBox,
                endWidget: endBox,
            }),
            setup: self => {
                self.connect('destroy', () => {
                    // Clean up all widgets
                    [...addedStart, ...addedCenter, ...addedEnd].forEach(widget => {
                        if (widget?.destroy) {
                            try {
                                widget.destroy();
                            } catch (error) {
                                console.error('Error destroying widget:', error);
                            }
                        }
                    });
                });
            },
        });

        return content;
    } catch (error) {
        console.error('Error creating bar content:', error);
        return null;
    }
};
