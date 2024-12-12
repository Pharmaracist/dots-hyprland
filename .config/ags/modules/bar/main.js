const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from"../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { BarCornerTopleft, BarCornerTopright } from "./barcorners.js";

// Module imports - Status
import BatteryModule from "./modules/battery.js";
import PowerDrawWidget from "./modules/powerdraw.js";
import SystemResources from "./modules/resources.js";
import System from "./modules/system.js";

// Module imports - Controls
import BarToggles from "./modules/bar_toggles.js";
import { BarButton } from "./modules/simple_button.js";
import Shortcuts from "./modules/utils.js";
import KbLayout from "./modules/kb_layout.js";

// Module imports - Info
import BarClock from "./modules/clock.js";
import simpleClock from "./modules/simple_clock.js";
import WindowTitle from "./modules/spaceleft.js";
import Indicators from "./modules/spaceright.js";

// Module imports - Media
import Music from "./modules/mixed.js";
import MusicStuff from "./modules/music.js";
import Cava from "./modules/cava.js";

// Layout Components
const createModule = (className) => (children) => Widget.Box({
    className,
    children,
});
const SideModule = createModule("bar-largesidemodule");
const LargeSideModule = createModule("bar-largesidemodule");
const NormSideModule = createModule("bar-normsidemodule margin-rl-5");
const SmallSideModule = createModule("bar-smallsidemodule");
const MarginSideModule = createModule("margin-rl-10");

const separator = () => Widget.Box({
    className: "bar-separator margin-rl-10",
    child: Widget.Label({
        label: "|",
    }),
});

// Workspace handling
const NormalOptionalWorkspaces = async () => {
    try {
        return (await import("./modules/workspaces_hyprland.js")).default();
    } catch {
        try {
            return (await import("./modules/workspaces_sway.js")).default();
        } catch {
            return null;
        }
    }
};

const FocusOptionalWorkspaces = async () => {
    try {
        return (await import("./modules/workspaces_hyprland_focus.js")).default();
    } catch {
        return null;
    }
};

// Bar corner components

const attachCorners = async (barContent) => {
    if (userOptions.asyncGet().bar.position === "top") {
        const topLeftCorner = await BarCornerTopleft();
        const topRightCorner = await BarCornerTopright();

        return Widget.Stack({
            homogeneous: false,
            children: [barContent, topLeftCorner, topRightCorner],
        });
    }
    return barContent;
};

// Bar content layouts
const createNormalBar = async () => {
    const content = await Widget.CenterBox({
        className: "bar-bg",
        startWidget: await WindowTitle(),
        centerWidget: Widget.Box({
            className: "spacing-h-5",
            children: [
                NormSideModule([Music()]),
                SmallSideModule([await NormalOptionalWorkspaces()]),
                NormSideModule([System()]),
            ],
        }),
        endWidget: Widget.Box({
            className: "end-widget",
            children: [Indicators()],
        }),
    });
    return content;
};

const createFloatingBar = async () => Widget.CenterBox({
    className: "bar-floating",
    css: "min-height: 3rem;",
    startWidget: Widget.Box({
        className: "start-widget",
        children: [
            await BatteryModule(),
            MarginSideModule([await FocusOptionalWorkspaces()]),
        ],
    }),
    centerWidget: SmallSideModule([MusicStuff()]),
    endWidget: Widget.Box({
        className: "end-widget",
        children: [
            Widget.Box({
                children: [
                    await Indicators(),
                    await PowerDrawWidget(),
                    separator(),
                    simpleClock(),
                    BarButton(),
                ],
            }),
        ],
    }),
});

const createHangedBar = async () => Widget.CenterBox({
    className: "bar-hang",
    css: "min-height: 3rem;",
    startWidget: Widget.Box({       
        className: "start-widget",
        children: [
            await BatteryModule(),
            NormSideModule([await FocusOptionalWorkspaces()]),
            await Shortcuts(),
        ],
    }),
    centerWidget: BarClock(),
    endWidget: Widget.Box({
        className: "end-widget",
        children: [
            Widget.Box({
                children: [
                    await Indicators(),
                    separator(),
                    SystemResources(),
                ],
            }),
        ],
    }),
});

const createNotchedBar = async () => Widget.CenterBox({
    css: "min-height: 3.5rem",
    startWidget: await WindowTitle(),
    centerWidget: Widget.Box({
        className: "spacing-h-15 bar-notch",
        children: [
            await Music(),
            NormSideModule([await NormalOptionalWorkspaces()]),
            await System()
        ],
    }),
    endWidget: Widget.Box({
        className: "end-widget",
        children: [
            await Indicators()
        ],
    }),
});

const createMinimalBar = async () => Widget.CenterBox({
    className: "bar-bg",
    startWidget: Widget.Box({
        className: "start-widget",
        children: [
            await BatteryModule(),
            MarginSideModule([await FocusOptionalWorkspaces()]),
            SystemResources(),
        ],
    }),
    centerWidget: BarClock(),
    endWidget: Widget.Box({
        className: "end-widget",
        children: [
            await Indicators()
        ],
    }),
});

const Bar = async (monitor = 0) => {
    const options = userOptions.asyncGet();
    const floatingBarContent = await createFloatingBar();
    const normalBarContent = await createNormalBar();
    const hangedBarContent = await createHangedBar();
    const nothingContent = Widget.Box({
        className: "bar-bg-nothing",
    });
    const notchedBarContent = await createNotchedBar();
    const minimalBarContent = await createMinimalBar();

    return Widget.Window({
        name: `bar-${monitor}`,
        className: "bar-window",
        monitor,
        anchor: ["top", "left", "right"],
        exclusivity: "exclusive",
        layer: "top",
        visible: true,
        child: Widget.Stack({
            homogeneous: false,
            transition: "slide_up_down",
            transitionDuration: options.animations?.durationSmall || 110,
            children: {
                mode1: floatingBarContent,
                mode2: notchedBarContent,
                mode3: nothingContent,
                mode4: hangedBarContent,
                mode5: await attachCorners(normalBarContent), 
                mode6: await attachCorners(minimalBarContent), 
            },
            setup: (self) => {
                self.hook(currentShellMode, (self) => {
                    self.shown = `mode${currentShellMode.value[monitor]}`;
                });
            },
        }),
    });
};

export default Bar;