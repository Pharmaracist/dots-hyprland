const { Gtk, GLib } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { EventBox, Button } = Widget;

import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Applications from 'resource:///com/github/Aylur/ags/service/applications.js';
const { execAsync, exec } = Utils;
const { Box, Revealer } = Widget;
import { setupCursorHover } from '../.widgetutils/cursorhover.js';
import { getAllFiles, searchIcons } from './icons.js'
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { substitute } from '../.miscutils/icons.js';
import { dockPinned, currentDockMode } from '../../variables.js';
import { DockLayouts, createDockContent } from './layouts.js';

const configPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
const readConfig = () => JSON.parse(Utils.readFile(configPath));

// Watch for config changes
Utils.monitorFile(configPath, (_, event) => {
    if (event === 'changed') {
        // Reload pinned apps
        const dockBox = App.getWindow('dock').get_children()[0];
        const pinnedBox = dockBox.get_children()[0].get_children()[0].get_children()[2];
        pinnedBox.children = PinnedApps().children;
    }
});

let isPinned = false;
dockPinned.connect('changed', () => {
    isPinned = dockPinned.value;
});

const icon_files = readConfig().icons.searchPaths.map(e => getAllFiles(e)).flat(1)

let cachePath = new Map()

let timers = []

function clearTimes() {
    timers.forEach(e => GLib.source_remove(e))
    timers = []
}

function ExclusiveWindow(client) {
    const fn = [
        (client) => !(client !== null && client !== undefined),
        // Jetbrains
        (client) => client.title.includes("win"),
        // Vscode
        (client) => client.title === '' && client.class === ''
    ]

    for (const item of fn) { if (item(client)) { return true } }
    return false
}

const focus = ({ address }) => Utils.execAsync(`hyprctl dispatch focuswindow address:${address}`).catch(print);

const DockSeparator = (props = {}) => Box({
    ...props,
    className: 'dock-separator',
})

const PinButton = () => Widget.Button({
    className: 'dock-app-btn dock-app-btn-animate',
    tooltipText: 'Pin Dock',
    child: Widget.Box({
        homogeneous: true,
        className: 'dock-app-icon txt',
        child: MaterialIcon('push_pin', 'hugeass')
    }),
    onClicked: (self) => {
        dockPinned.value = !dockPinned.value;
        self.className = `${dockPinned.value ? "pinned-dock-app-btn" : "dock-app-btn animate"} dock-app-btn-animate`;
    },
    setup: setupCursorHover,
})

const LauncherButton = () => Widget.Button({
    className: 'dock-app-btn dock-app-btn-animate',
    tooltipText: 'Open launcher',
    child: Widget.Box({
        homogeneous: true,
        className: 'dock-app-icon txt',
        child: MaterialIcon('apps', 'hugerass')
    }),
    onClicked: (self) => {
        App.toggleWindow('overview');
    },
    setup: setupCursorHover,
})

const AppButton = ({ icon, ...rest }) => Widget.Revealer({
    attribute: {
        'workspace': 0
    },
    revealChild: false,
    transition: 'slide_right',
    transitionDuration: readConfig().animations.durationLarge,
    child: Widget.Button({
        ...rest,
        className: 'dock-app-btn dock-app-btn-animate',
        child: Widget.Box({
            child: Widget.Overlay({
                child: Widget.Box({
                    homogeneous: true,
                    className: 'dock-app-icon',
                    child: Widget.Icon({
                        icon: icon,
                    }),
                }),
                overlays: [Widget.Box({
                    class_name: 'indicator',
                    vpack: 'end',
                    hpack: 'center',
                })],
            }),
        }),
        setup: (button) => {
            setupCursorHover(button);
        }
    })
});

const Taskbar = (monitor) => Widget.Box({
    className: 'dock-apps',
    attribute: {
        monitor: monitor,
        'map': new Map(),
        'clientSortFunc': (a, b) => {
            return a.attribute.workspace > b.attribute.workspace;
        },
        'update': (box, monitor) => {
            for (let i = 0; i < Hyprland.clients.length; i++) {
                const client = Hyprland.clients[i];
                if (client["pid"] == -1) return;
                const appClass = substitute(client.class);
                // for (const appName of userOptions.asyncGet().dock.pinnedApps) {
                //     if (appClass.includes(appName.toLowerCase()))
                //         return null;
                // }
                let appClassLower = appClass.toLowerCase()
                let path = ''
                if (cachePath[appClassLower]) { path = cachePath[appClassLower] }
                else {
                    path = searchIcons(appClass.toLowerCase(), icon_files)
                    cachePath[appClassLower] = path
                }
                if (path === '') { path = substitute(appClass) }
                const newButton = AppButton({
                    icon: path,
                    tooltipText: `${client.title} (${appClass})`,
                    onClicked: () => focus(client),
                });
                newButton.attribute.workspace = client.workspace.id;
                newButton.revealChild = true;
                box.attribute.map.set(client.address, newButton);
            }
            box.children = Array.from(box.attribute.map.values());
        },
        'add': (box, address, monitor) => {
            if (!address) { // First active emit is undefined
                box.attribute.update(box);
                return;
            }
            const newClient = Hyprland.clients.find(client => {
                return client.address == address;
            });
            if (ExclusiveWindow(newClient)) { return }
            let appClass = newClient.class
            let appClassLower = appClass.toLowerCase()
            let path = ''
            if (cachePath[appClassLower]) { path = cachePath[appClassLower] }
            else {
                path = searchIcons(appClassLower, icon_files)
                cachePath[appClassLower] = path
            }
            if (path === '') { path = substitute(appClass) }
            const newButton = AppButton({
                icon: path,
                tooltipText: `${newClient.title} (${appClass})`,
                onClicked: () => focus(newClient),
            })
            newButton.attribute.workspace = newClient.workspace.id;
            box.attribute.map.set(address, newButton);
            box.children = Array.from(box.attribute.map.values());
            newButton.revealChild = true;
        },
        'remove': (box, address) => {
            if (!address) return;

            const removedButton = box.attribute.map.get(address);
            if (!removedButton) return;
            removedButton.revealChild = false;

            Utils.timeout(readConfig().animations.durationLarge, () => {
                removedButton.destroy();
                box.attribute.map.delete(address);
                box.children = Array.from(box.attribute.map.values());
            })
        },
    },
    setup: (self) => {
        self.hook(Hyprland, (box, address) => box.attribute.add(box, address, self.monitor), 'client-added')
            .hook(Hyprland, (box, address) => box.attribute.remove(box, address, self.monitor), 'client-removed')
        Utils.timeout(100, () => self.attribute.update(self));
    },
});

const PinnedApps = () => Widget.Box({
    class_name: 'dock-apps',
    homogeneous: true,
    children: readConfig().dock.pinnedApps
        .map(term => ({ app: Applications.query(term)?.[0], term }))
        .filter(({ app }) => app)
        .map(({ app, term = true }) => {
            const newButton = AppButton({
                // different icon, emm...
                icon: readConfig().dock.searchPinnedAppIcons ?
                    searchIcons(app.name, icon_files) :
                    app.icon_name,
                onClicked: () => {
                    for (const client of Hyprland.clients) {
                        if (client.class.toLowerCase().includes(term))
                            return focus(client);
                    }

                    app.launch();
                },
                onMiddleClick: () => app.launch(),
                tooltipText: app.name,
                setup: (self) => {
                    self.revealChild = true;
                    self.hook(Hyprland, button => {
                        const running = Hyprland.clients
                            .find(client => client.class.toLowerCase().includes(term)) || false;

                        button.toggleClassName('notrunning', !running);
                        button.toggleClassName('focused', Hyprland.active.client.address == running.address);
                        button.set_tooltip_text(running ? running.title : app.name);
                    }, 'notify::clients')
                },
            })
            newButton.revealChild = true;
            return newButton;
        }),
});

const DockModules = {
    pin: () => PinButton(),
    launcher: () => LauncherButton(),
    taskbar: () => Taskbar(),
    pinned: () => PinnedApps(),
};

export default (monitor = 0) => {
    const stack = Widget.Stack({
        transition: 'slide_up_down',
        transitionDuration: readConfig().animations?.durationSmall || 60,
    });

    // Initialize layouts
    Promise.all([
        createDockContent(DockLayouts[1], DockModules),
        createDockContent(DockLayouts[2], DockModules),
        createDockContent(DockLayouts[3], DockModules),
        createDockContent(DockLayouts[4], DockModules),
        createDockContent(DockLayouts[5], DockModules),
    ]).then(contents => {
        stack.items = [
            ['mode1', contents[0]],
            ['mode2', contents[1]],
            ['mode3', contents[2]],
            ['mode4', contents[3]],
            ['mode5', contents[4]],
        ];
    });

    currentDockMode.connect('changed', () => {
        stack.shown = `mode${currentDockMode.value}`;
    });

    const dockRevealer = Widget.Revealer({
        revealChild: false,
        transition: 'slide_up',
        transitionDuration: readConfig().animations?.durationSmall || 60,
        child: stack,
    });

    return EventBox({
        onHover: () => {
            clearTimes();
            dockRevealer.revealChild = true;
        },
        child: Box({
            homogeneous: true,
            css: `min-height: ${readConfig().dock.hiddenThickness}px;`,
            children: [dockRevealer],
        }),
        setup: self => self.on("leave-notify-event", () => {
            if (!dockPinned.value) dockRevealer.revealChild = false;
            clearTimes();
        })
    });
};
