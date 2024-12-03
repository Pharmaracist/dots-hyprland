const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import BarClock from "./normal/clock.js";
import WindowTitle from "./normal/spaceleft.js";
import Indicators from "./normal/spaceright.js";
import MusicStuff from "./normal/music.js";
import Utilities from "./normal/utils.js";
import SystemResourcesOrCustomModule from "./normal/resources.js";
import Music from "./normal/MResources.js";
import BarBattery from "./normal/battery.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { currentShellMode } from "../../variables.js";
import MidTitle from "./normal/wintitle.js";
import resources from "./normal/resources.js";
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
  const EndModule = (children) =>
    Widget.Box({
      className: "bar-end",
      children: children,
    });
  const metroBar = Widget.CenterBox({
    className: "bar-bg",
    setup: (self) => {
      const styleContext = self.get_style_context();
      const minHeight = styleContext.get_property(
        "min-height",
        Gtk.StateFlags.NORMAL,
      );
    },
    startWidget: Widget.Box({
      // className: "spacing-h-15",
      css: "margin-left:1.8rem;",
      homogeneous: false,
      children: [
        Widget.Box({
          className: "spacing-h-15",
          css: "margin-left:0.8rem;",
          children: [await FocusOptionalWorkspaces()],
        }),
      ],
    }),
    centerWidget: EndModule([await MusicStuff()]),
    endWidget: Widget.Box({
      css: "margin-right:1.8rem;",
      children: [
        Indicators(),
        Widget.Box({
          className: "",
          css: "margin-left:0.3rem;",
          children: [await resources()],
        }),
        BarBattery(),
      ],
    }),
  });
  const nothingContent = Widget.CenterBox({
    className: "bar-bg",
    setup: (self) => {
      const styleContext = self.get_style_context();
      const minHeight = styleContext.get_property(
        "min-height",
        Gtk.StateFlags.NORMAL,
      );
    },
    startWidget: Widget.Box({
      className: "spacing-h-15",
      css: "margin-left:1.8rem;",
      homogeneous: false,
      children: [
        await BarBattery(),
        Widget.Box({
          className: "",
          css: "margin-left:0.8rem;",
          children: [await FocusOptionalWorkspaces()],
        }),
        // SystemResourcesOrCustomModule(),
        EndModule([]),
      ],
    }),
    centerWidget: Widget.Box({
      children: [MusicStuff()],
    }),
    endWidget: Widget.Box({
      className: "",
      css: "margin-right:1.8rem;",
      children: [await Indicators()],
    }),
  });
  const normalBarContent = Widget.CenterBox({
    className: "bar-bg",
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
      className: "spacing-h-5",
      children: [
        // SideModule([, await SystemResourcesOrCustomModule()]),
        SideModule([await Music()]),
        Widget.Box({
          homogeneous: true,
          children: [await NormalOptionalWorkspaces()],
        }),
        EndModule([
          Widget.Box({
            homogeneous: false,
            className: "spacing-h-5 bar-clock-box",
            children: [BarClock()],
          }),
        ]),
        EndModule([Utilities()]),
        EndModule([BarBattery()]),
      ],
    }),
    endWidget: Widget.Box({
      homogeneous: true,
      css: "margin-right:0.8rem",
      children: [await Indicators()],
    }),
  });
  const focusedBarContent = Widget.CenterBox({
    className: "bar-bg-focus",
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

  return Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: [userOptions.asyncGet().bar.position, "left", "right"],
    exclusivity: "exclusive",
    visible: true,
    child: Widget.Stack({
      homogeneous: false,
      transition: "slide_up_down",
      transitionDuration: userOptions.asyncGet().animations.durationLarge,
      children: {
        normal: normalBarContent,
        focus: metroBar,
        nothing: nothingContent,
        // metro: metroBar,
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
