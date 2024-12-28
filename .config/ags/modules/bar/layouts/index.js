// Layout definitions for different bar modes
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import ScrollableContainer from '../modules/scrollable.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';

// Create variables to track sidebar visibility
const sideleftVisible = Variable(false);
const siderightVisible = Variable(false);

App.connect('window-toggled', (_, name, visible) => {
    if (name === 'sideleft') {
        sideleftVisible.value = visible;
    }
    else if (name === 'sideright') {
        siderightVisible.value = visible;
    }
});

// Utility component for visual separation
export const Separator = () => Widget.Box({
    className: "txt-hugerass sec-txt",
    css:"font-weight:100;",
    child: Widget.Label({ label: "| " }),
});

export const Dent = () => Widget.Box({});

// Bar layout configurations for different modes
export const BarLayouts = {
    1:{ // Pads
        name: 'Pads',
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
            })],
            end: [
                Widget.Box({
                    className: 'bar-round-padding',
                    children: [
                        modules.InfoModules.weather(),
                    ],
                }),
                Widget.Box({
                    children: [
                        modules.StatusModules.tray(),
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
    2: { // Knocks with scrollable modules
        name: 'Knocks',
        layout: (modules) => ({
            start: [
            ],
            center: [
                Widget.Revealer({
                    transition: 'slide_right',
                    transitionDuration: 100,
                    connections: [[sideleftVisible, self => {
                        self.reveal_child = sideleftVisible.value;
                    }]],
                    child:  ScrollableContainer({
                        hpack: 'end',
                        sets: [
                            [Widget.Box({
                                className: 'bar-knocks padding-rl-15',
                                hexpand: true,
                                hpack: 'end',
                                children: [modules.InfoModules.colorPicker()],
                                })],
                            [Widget.Box({
                                hexpand: true,
                                hpack: 'start',
                                className: 'bar-knocks padding-rl-15',
                                children: [ modules.InfoModules.colorscheme()],
                            })],
                        ],
                    }),
                }),
                ScrollableContainer({
                    name: 'media',
                    sets: [
                        [Widget.Box({
                            hpack: 'fill',
                            hexpand: true,
                            className: 'bar-knocks padding-rl-5',
                            children: [modules.MediaModules.musicStuff()],
                        })],
                        [Widget.Box({
                            hexpand: true,
                            hpack: 'fill',
                            className: 'bar-knocks padding-rl-15',
                            children: [
                                Widget.Box({ hpack: 'center', children: [modules.AppModules.pinnedApps()]}) ],
                        })],
                        [Widget.Box({
                            hpack: 'end',
                            hexpand: true,
                            className: 'bar-knocks',
                            children: [ Widget.Label({ label: "     ",}) , modules.InfoModules.quote()],
                        })],
                    ],
                }),
                ScrollableContainer({
                    name: 'media',
                    sets: [
                        [Widget.Box({
                            css:`min-width:16rem;`,
                            hexpand: true,
                            className: 'bar-knocks padding-rl-15',
                            children: [modules.workspaces.normal()],
                        })],
                        [Widget.Box({
                            hexpand: true,
                            className: 'bar-knocks padding-rl-15',
                            children: [
                                modules.InfoModules.weather()
                            ],
                        })],
                    ],
                }),
               
                ScrollableContainer({
                    name: 'tezy',
                    sets: [
                        [Widget.Box({
                            css:`min-width:20rem;`,
                            hexpand: true,
                            hpack: 'fill',
                            className: ' bar-knocks padding-rl-15',
                            children: [
                                modules.InfoModules.simpleClock(),
                                modules.ControlModules.keyboard(),
                                modules.InfoModules.indicators(),
                                modules.StatusModules.resourcesBar(),
                                modules.StatusModules.battery(),
                            ]
                        })],
                        [Widget.Box({
                            hpack: 'fill',
                            hexpand: true,
                            className: 'bar-knocks padding-rl-10',
                            children: [ Widget.Box({ hpack: 'center',hexpand: true, children: [modules.InfoModules.fetcher()]})],
                        })],
                    ],
                }),
                Widget.Revealer({
                    transition: 'slide_left',
                    transitionDuration: 120,
                    connections: [[siderightVisible, self => {
                        self.reveal_child = siderightVisible.value;
                    }]],
                    child: ScrollableContainer({
                        sets: [
                            [Widget.Box({
                                hpack: 'center',
                                css:`min-width:18rem;`,
                                className: 'spacing-h-15 bar-knocks padding-rl-15',
                                children: [ modules.ControlModules.shortcuts()],
                            })],
                            [Widget.Box({
                                css:`min-width:23rem;`,
                                className: 'spacing-h-15 bar-knocks padding-rl-15',
                                children: [ modules.InfoModules.logo() , modules.InfoModules.quote()],
                            })],
                        ],
                    }),
                }),
                        
               

                // Second scrollable for media
             
            ],
            end: [
            ],
        }),
    },
    3: { // Normal
        name: 'normal',
        className: 'bar-bg',
        css:"min-height:2.23rem",
        layout: (modules) => ({
            start: [
                modules.InfoModules.windowTitle(),
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
    4: { // Minimal
        name: 'Minimal',
        className: 'bar-floating-short',
        css:"min-height:2.71rem",
        layout: (modules) => ({
            start: [    ScrollableContainer({
                name: 'media',
                sets: [
                    [Widget.Box({
                        hexpand: true,
                        halign: 'center',
                        children: [
                            modules.StatusModules.battery(),
                        ],
                    })],
                    [Widget.Box({})],
                ],
            }),
                ScrollableContainer({
                    name: 'media',
                    sets: [
                        [Widget.Box({
                            hexpand: true,
                            halign: 'center',
                            children: [
                                modules.workspaces.normal(),
                            ],
                        })],
                        [Widget.Box({
                            hexpand: true,
                            hpack: 'center',
                            children: [modules.workspaces.focus()],
                        })],
                        [Widget.Box({
                            hexpand: true,
                            hpack: 'center',
                            children: [modules.ControlModules.shortcuts()],
                        })],
                    ],
                }),
            ],
            center: [
                ScrollableContainer({
                    name: 'media',
                    sets: [
                        [Widget.Box({
                            children: [
                                modules.InfoModules.weather(),
                            ],
                        })],
                        [Widget.Box({
                            hpack:"center",
                            hexpand:true,
                            children: [modules.InfoModules.clock()],
                        })],
                        [Widget.Box({
                            children: [modules.AppModules.pinnedApps()],
                        })],
                        [Widget.Box({
                            spacing:10,
                            hpack:"center",
                            hexpand:true,
                            // className: "spacing-h-5",
                            children: [modules.InfoModules.colorPicker()],
                        })],
                        Widget.Box({}),
                    ],
                }),
            ],
            end: [
                ScrollableContainer({
                    name: 'media',
                    sets: [
                        [Widget.Box({
                            children: [modules.StatusModules.tray()],
                        })],
                        [Widget.Box({
                            children: [],
                        })],
                    ],
                }),
                ScrollableContainer({
                    name: 'media',
                    sets: [
                        [Widget.Box({
                            children: [modules.InfoModules.indicators()],
                        })],
                        [Widget.Box({
                            children: [],
                        })],
                    ],
                }),
            ],
        }),
    },
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