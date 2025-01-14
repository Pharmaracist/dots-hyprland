const { Gtk } = imports.gi;
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import PowerDrawWidget from "./normal/powerdraw.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import BatteryModule from "./normal/battery.js";
import Music from "./normal/mixed.js";
import MusicStuff from "./normal/music.js";
import WindowTitle from "./normal/spaceleft.js";
import Indicators from "./normal/spaceright.js";
import System from "./normal/system.js";
import Utilities from "./normal/utils.js";
// Import all bar modules
import ActiveApps from './modules/active_apps.js';
import AppMenu from './modules/app_menu.js';
import BarToggles from './modules/bar_toggles.js';
import BatteryIndicator from './modules/battery.js';
import Cava from './modules/cava.js';
import Clock from './modules/clock.js';
import ColorPicker from './modules/color_picker.js';
import Fetcher from './modules/fetcher.js';
import Icon from './modules/icon.js';
import IdleInhibitor from './modules/idle_inhibitor.js';
import KbLayout from './modules/kb_layout.js';
import Media from './modules/media.js';
import Mixed from './modules/mixed.js';
import MusicPlayer from './modules/music.js';
import NetworkSpeed from './modules/networkspeed.js';
import NotificationCenter from './modules/notification_center.js';
import PinnedApps from './modules/pinned_apps.js';
import PowerDraw from './modules/powerdraw.js';
// import PowerMode from './modules/powermode.js';
import Quote from './modules/quote.js';
import Resources from './modules/resources.js';
import ResourcesBar from './modules/resourcesbar.js';
import RevealerControl from './modules/revealercontrol.js';
import { BarButton } from './modules/simple_button.js';
import SimpleClock from './modules/simple_clock.js';
import SpaceLeft from './modules/spaceleft.js';
import SpaceRight from './modules/spaceright.js';
import SystemInfo from './modules/system.js';
import { Tray } from './modules/tray.js';
import Utils from './modules/utils.js';
import Wave from './modules/wave.js';
import Weather from './modules/weather.js';
import WindowTitleModule from './modules/window_title.js';
import spaceright from "./normal/spaceright.js";

const { GLib } = imports.gi;

// Define time formats
const timeFormat = "%I:%M";
const dateFormat = "%A, %d %B %Y";

const time = new Variable("", {
  poll: [1000, () => GLib.DateTime.new_now_local().format(timeFormat)],
});

const date = new Variable("", {
  poll: [1000, () => GLib.DateTime.new_now_local().format(dateFormat)],
});

const simpleClock = () =>
  Widget.Box({
    vpack: "center",
    hexpand: false,
    className: "spacing-h-4 bar-clock-box",
    children: [
      Widget.Label({
        className: "bar-time",
        label: time.bind(),
        tooltipText: date.bind(),
      }),
    ],
  });
const NormalOptionalWorkspaces = async () => {
  try {
    return (await import("./normal/workspaces_hyprland.js")).default();
  } catch {
    try {
      return (await import("./normal/workspaces_sway.js")).default();
    } catch {
      return null;
    }
  }
};

const FocusOptionalWorkspaces = async () => {
  try {
    return (await import("./focus/workspaces_hyprland.js")).default();
  } catch {
    try {
      return (await import("./focus/workspaces_sway.js")).default();
    } catch {
      return null;
    }
  }
};

export const Bar = async (monitor = 0) => {
  const SideModule = (children) =>
    Widget.Box({
      className: "bar-sidemodule",
      children: children,
    });

  const bar1 = Widget.CenterBox({
    className: "bar-bg",
    css:`padding:0 1rem`,
    setup: (self) => {
      const styleContext = self.get_style_context();
      const minHeight = styleContext.get_property(
        "min-height",
        Gtk.StateFlags.NORMAL,
      );
      // execAsync(['bash', '-c', `hyprctl keyword monitor ,addreserved,${minHeight},0,0,0`]).catch(print);
    },
    startWidget: await WindowTitle(monitor),
    centerWidget: Widget.Box({
      className: "spacing-h-4",
      children: [
        SideModule([Music()]),
        Widget.Box({
          className: "bar-group-margin",
          // homogeneous: true,
          children: [
            Widget.Box({
              css: `padding:0 8px;margin: 1px 0`,
              className: "bar-group bar-group-standalone",
              children: [await NormalOptionalWorkspaces()],
            }),
          ],
        }),
        SideModule([System()]),
      ],
    }),
    endWidget: Indicators(monitor),
  });
  // const bar2 = Widget.CenterBox({
  //   css: "margin:0.5rem 2.2rem",
  //   startWidget: Widget.Box({
  //     vpack: "center",
  //     vexpand: true,
  //     child: await SpaceLeft(),
  //   }),
  //   centerWidget: Widget.Box({
  //     spacing: 5,
  //     children: [
  //       Widget.Box({
  //         css: `min-width:25rem`,
  //         className: "bar-knocks",
  //         children: [Media()],
  //       }),
  //       Widget.Box({
  //         className: "bar-knocks",
  //         children: [await NormalOptionalWorkspaces()],
  //       }),
  //       Widget.Box({
  //         homogeneous: false,
  //         className: "bar-knocks",
  //         spacing: 5,
  //         children: [SimpleClock(), KbLayout(), await SpaceRight(),await BatteryModule()],
  //       }),
  //     ],
  //   }),
  //   endWidget: Widget.Box({
  //     children: [
      
  //     ],
  //   }),
  // });
  const bar3 = Widget.CenterBox({
    className: "bar-floating",
    css: "min-height:45px;",
    setup: (self) => {
      const styleContext = self.get_style_context();
      const minHeight = styleContext.get_property(
        "min-height",
        Gtk.StateFlags.NORMAL,
      );
    },
    startWidget: Widget.Box({
      css: "margin-left:1.8rem;",
      className: "spacing-h-15",
      spacing: 20,
      children: [
        await BatteryModule(),
        Widget.Box({
          // css: `margin:-5px; padding: 0 10px;border-radius:20px`,
          // className: "bar-group",
          children: [await NormalOptionalWorkspaces()],
        }),
      ],
    }),
    centerWidget: Clock(),
    endWidget: Widget.Box({
      children: [await spaceright()],
    }),
  });
  const bar4 = Widget.CenterBox({
    className: "bar-bg-focus",
    css:`min-height:1.8rem`,
    startWidget: Widget.Box({}),
    centerWidget: Widget.Box({
      className: "spacing-h-4",
      children: [
        SideModule([]),
        Widget.Box({
          homogeneous: true,
          children: [await FocusOptionalWorkspaces()],
        }),
        SideModule([]),
      ],
    }),
    endWidget: Widget.Box({}),
    setup: (self) => {
      self.hook(Battery, (self) => {
        if (!Battery.available) return;
        self.toggleClassName(
          "bar-bg-focus-batterylow",
          Battery.percent <= userOptions.asyncGet().battery.low,
        );
      });
    },
  });
  const bar2 = Widget.Box({
    className: "bar-bg-nothing",
  });

  const mainBar = Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: [userOptions.asyncGet().bar.position, "right", "left"],
    exclusivity: "exclusive",
    visible: true,
    child: Widget.Stack({
      homogeneous: false,
      transition: "slide_up_down",
      transitionDuration: userOptions.asyncGet().animations.durationLarge,
      children: {
        "0": bar1,
        "1": bar2,
        "2": bar3,
        "3": bar4,
        // "4": bar5,
      },
      setup: (self) =>
        self.hook(currentShellMode, (self) => {
          const mode = currentShellMode.value[monitor] || "0";
          self.shown = mode;
          // Show/hide corners based on mode
          App.getWindow(`barcornertl${monitor}`).visible = mode === "0" || mode === "3";
          App.getWindow(`barcornertr${monitor}`).visible = mode === "0" || mode === "3";
        }),
    }),
  });

  const leftCorner = BarCornerTopleft(monitor);
  const rightCorner = BarCornerTopright(monitor);

  return [mainBar, leftCorner, rightCorner];
};

export const BarCornerTopleft = (monitor = 0) => 
  Widget.Window({
    monitor,
    name: `barcornertl${monitor}`,
    layer: "top",
    anchor: [userOptions.asyncGet().bar.position, "left"],
    exclusivity: "normal",
    visible: currentShellMode.bind().transform(modes => {
      const mode = modes[monitor] || "0";
      return mode === "0" || mode === "3";
    }),
    child: RoundedCorner(
      userOptions.asyncGet().bar.position === "top" ? "topleft" : "bottomleft",
      { className: "corner" },
    ),
    setup: enableClickthrough,
  });

export const BarCornerTopright = (monitor = 0) => 
  Widget.Window({
    monitor,
    name: `barcornertr${monitor}`,
    layer: "top",
    anchor: [userOptions.asyncGet().bar.position, "right"],
    exclusivity: "normal",
    visible: currentShellMode.bind().transform(modes => {
      const mode = modes[monitor] || "0";
      return mode === "0" || mode === "3";
    }),
    child: RoundedCorner(
      userOptions.asyncGet().bar.position === "top"
        ? "topright"
        : "bottomright",
      { className: "corner" },
    ),
    setup: enableClickthrough,
  });
