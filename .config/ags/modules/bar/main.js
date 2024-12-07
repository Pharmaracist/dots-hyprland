const { Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

import WindowTitle from "./normal/spaceleft.js";
import Indicators from "./normal/spaceright.js";
import Music from "./normal/mixed.js";
import System from "./normal/system.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { currentShellMode } from '../../variables.js';
import BatteryModule from "./normal/battery.js"
import MusicStuff from "./normal/music.js"
import BarClock from "./normal/clock.js"
import Utilities from './normal/utils.js';
const { GLib } = imports.gi;
import { Variable } from 'resource:///com/github/Aylur/ags/variable.js';




// Define time formats
const timeFormat = '%H:%M';
const dateFormat = '%A, %d %B %Y';

const time = new Variable('', {
    poll: [1000,
        () => GLib.DateTime.new_now_local().format(timeFormat),
    ],
});

const date = new Variable('', {
    poll: [1000,
        () => GLib.DateTime.new_now_local().format(dateFormat),
    ],
});

const simpleClock = () => Widget.Box({
    vpack: 'center',
    className: 'spacing-h-4 bar-clock-box',
    children: [
        Widget.Label({
            className: 'bar-time',
            label: time.bind(),
            tooltipText: date.bind(),
        }),
    ],
});
const NormalOptionalWorkspaces = async () => {
    try {
        return (await import('./normal/workspaces_hyprland.js')).default();
    } catch {
        try {
            return (await import('./normal/workspaces_sway.js')).default();
        } catch {
            return null;
        }
    }
};

const FocusOptionalWorkspaces = async () => {
    try {
        return (await import('./focus/workspaces_hyprland.js')).default();
    } catch {
        try {
            return (await import('./focus/workspaces_sway.js')).default();
        } catch {
            return null;
        }
    }
};

export const Bar = async (monitor = 0) => {
    const SideModule = (children) => Widget.Box({
        className: 'bar-sidemodule',
        children: children,
    });
    const normalBarContent = Widget.CenterBox({
        className: 'bar-bg',
        setup: (self) => {
            const styleContext = self.get_style_context();
            const minHeight = styleContext.get_property('min-height', Gtk.StateFlags.NORMAL);
            // execAsync(['bash', '-c', `hyprctl keyword monitor ,addreserved,${minHeight},0,0,0`]).catch(print);
        },
        startWidget: (await WindowTitle(monitor)),
        centerWidget: Widget.Box({
            className: 'spacing-h-4',
            children: [
                SideModule([Music()]),
                Widget.Box({
                    homogeneous: true,
                    children: [await NormalOptionalWorkspaces()],
                }),
                SideModule([System()]),
            ]
        }),
        endWidget: Indicators(monitor),
    });
    const metroBarContent = Widget.CenterBox({
        className: 'bar-bg',
        setup: (self) => {
            const styleContext = self.get_style_context();
            const minHeight = styleContext.get_property('min-height', Gtk.StateFlags.NORMAL);
        },
        startWidget: Widget.Box({
            css:"margin-left:1.8rem;",
            className: 'spacing-h-10',
            children: [
                await BatteryModule(),
                Widget.Box({
                    // css:"margin-left:0.3rem;",
                    // className: 'spacing-h-15',
                    homogeneous: true,
                    children: [await FocusOptionalWorkspaces(),
                    ]
                    
                }),
                SideModule([Utilities()])
            ]
        }),
        centerWidget: Widget.Box({
            // css:"margin-right:1.8rem;",
            children: [
                Widget.Box({
                    // css:"margin-right:-2.4rem;",
                    children: [await MusicStuff()],
                }),
            ]
        }),
        endWidget:  Widget.Box({
            css:"margin-right:1.8rem;",
            children: [
                Widget.Box({
                    css:"margin-right:-2.4rem;",
                    children: [await Indicators()],
                }),
                Widget.Box({
                    children: [simpleClock()],
                }),
            ]
        }),

    });
    const focusedBarContent = Widget.CenterBox({
        className: 'bar-bg-focus',
        startWidget: Widget.Box({}),
        centerWidget: Widget.Box({
            className: 'spacing-h-4',
            children: [
                SideModule([]),
                Widget.Box({
                    homogeneous: true,
                    children: [await FocusOptionalWorkspaces()],
                }),
                SideModule([]),
            ]
        }),
        endWidget: Widget.Box({}),
        setup: (self) => {
            self.hook(Battery, (self) => {
                if (!Battery.available) return;
                self.toggleClassName('bar-bg-focus-batterylow', Battery.percent <= userOptions.asyncGet().battery.low);
            })
        }
    });
    const nothingContent = Widget.Box({
        className: 'bar-bg-nothing',
    })
    return Widget.Window({
        monitor,
        name: `bar${monitor}`,
        anchor: [userOptions.asyncGet().bar.position, 'left', 'right'],
        exclusivity: 'exclusive',
        visible: true,
        child: Widget.Stack({
            homogeneous: false,
            transition: 'slide_up_down',
            transitionDuration: userOptions.asyncGet().animations.durationLarge,
            children: {
                'normal': normalBarContent,
                'nothing': metroBarContent,
                'focus': metroBarContent,
            },
            setup: (self) => self.hook(currentShellMode, (self) => {
                self.shown = currentShellMode.value[monitor];
            })
        }),
    });
}

export const BarCornerTopleft = (monitor = 0) => Widget.Window({
    monitor,
    name: `barcornertl${monitor}`,
    layer: 'top',
    anchor: [userOptions.asyncGet().bar.position, 'left'],
    exclusivity: 'normal',
    visible: true,
    child: RoundedCorner(
        userOptions.asyncGet().bar.position === 'top' ? 'topleft' : 'bottomleft',
        { className: 'corner', }
    ),
    setup: enableClickthrough,
});

export const BarCornerTopright = (monitor = 0) => Widget.Window({
    monitor,
    name: `barcornertr${monitor}`,
    layer: 'top',
    anchor: [userOptions.asyncGet().bar.position, 'right'],
    exclusivity: 'normal',
    visible: true,
    child: RoundedCorner(
        userOptions.asyncGet().bar.position === 'top' ? 'topright' : 'bottomright',
        { className: 'corner', }
    ),
    setup: enableClickthrough,
});
