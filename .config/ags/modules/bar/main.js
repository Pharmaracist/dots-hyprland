const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { BarToggles } from "./modules/bar_toggles.js";
import BatteryModule from "./modules/battery.js";
import Music from "./modules/mixed.js";
import MusicStuff from "./modules/music.js";
import simpleClock from "./modules/simple_clock.js";
import WindowTitle from "./modules/spaceleft.js";
import Indicators from "./modules/spaceright.js";
import System from "./modules/system.js";
import Utilities from "./modules/utils.js";
import ClassWindow from "./modules/window_title.js";
import PowerDrawWidget from "./modules/powerdraw.js";
// import { BarButton } from "./modules/simple_button.js";
// import spaceleft from "./modules/spaceleft.js";
// import SystemResources from "./modules/resources.js"
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
    try {
      return (await import("./modules/workspaces_sway_focus.js")).default();
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

  const normalBarContent = await Widget.CenterBox({
    className: "bar-bg",
    setup: (self) => {
      const styleContext = self.get_style_context();
    },
    startWidget: await WindowTitle(),
    centerWidget: Widget.Box({
      className: "spacing-h-4",
      children: [
        SideModule([Music()]),
        Widget.Box({
          children: [await NormalOptionalWorkspaces()],
        }),
        SideModule([System()]),
      ],
    }),
    endWidget: Widget.Box({
      css: "margin-right:1rem",
      children: [Indicators()],
    }),
  });
  const floatingBarContent = await Widget.CenterBox({
    className: "bar-floating ",
    css: "min-height:2.9rem;",
    startWidget: Widget.Box({
      className: "start-widget",
      children: [
        await BatteryModule(),
        Widget.Box({
          className: "margin-rl-15",
          children: [await FocusOptionalWorkspaces()],
        }),
        await PowerDrawWidget(),
      ],
    }),
    centerWidget: Widget.Box({
      className: "spacing-h-10",
      children: [MusicStuff()],
    }),
    endWidget: Widget.Box({
      className: "end-widget",
      children: [
        Widget.Box({
          children: [
            await Indicators(),
            Widget.Box({
              css: "margin-left:-15px",
              children: [simpleClock()],
            }),
          ],
        }),
      ],
    }),
  });
  const minimalBarContent = await Widget.CenterBox({
    className: "bar-bg ",
    setup: (self) => {
      const styleContext = self.get_style_context();
    },
    startWidget: Widget.Box({
      className: "start-widget",
      children: [
        await BatteryModule(),
        Widget.Box({
          className: "margin-rl-15",
          children: [await FocusOptionalWorkspaces()],
        }),
      ],
    }),
    centerWidget: await MusicStuff(),
    endWidget: Widget.Box({
      className: "end-widget",
      children: [
        await Indicators(),
        Widget.Box({
          css: "margin-left:-15px",
          children: [simpleClock()],
        }),
      ],
    }),
  });
  const notchedBarContent = await Widget.CenterBox({
    css: "min-height:3rem",
    startWidget: await WindowTitle(),
    centerWidget: Widget.Box({
      className: "spacing-h-25 bar-notch",
      children: [
        await Music(),
        Widget.Box({
          className: "margin-rl-5",
          children: [await NormalOptionalWorkspaces()],
        }),
        await System(),
      ],
    }),
    endWidget: Widget.Box({
      children: [
        Widget.Box({
          css: "margin-right:1.2rem;",
          children: [await Indicators()],
        }),
      ],
    }),
  });

  return Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: [userOptions.asyncGet().bar.position, "right", "left"],
    exclusivity: "exclusive",
    visible: true,
    child: Widget.Stack({
      homogeneous: false,
      transition: "slide_up_down",
      transitionDuration: userOptions.asyncGet().animations.durationSmall,
      children: {
        mode1: normalBarContent,
        mode2: floatingBarContent,
        mode3: notchedBarContent,
        mode4: minimalBarContent,
      },
      setup: (self) =>
        self.hook(currentShellMode, (self) => {
          self.shown = currentShellMode.value[monitor];
        }),
    }),
  });
};
export const BarCornerTopleft = (monitor = 0) =>
  Widget.Window({
    monitor,
    name: `barcornertl${monitor}`,
    layer: "top",
    anchor: [userOptions.asyncGet().bar.position, "left"],
    exclusivity: "normal",
    visible: true,
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
    visible: true,
    child: RoundedCorner(
      userOptions.asyncGet().bar.position === "top"
        ? "topright"
        : "bottomright",
      { className: "corner" },
    ),
    setup: enableClickthrough,
  });
