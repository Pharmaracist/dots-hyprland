const { Gtk } = imports.gi;
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import PowerDrawWidget from "./modules/powerdraw.js";
import BatteryModule from "./modules/battery.js";
import Music from "./modules/mixed.js";
import MusicStuff from "./modules/music.js";
import WindowTitle from "./modules/spaceleft.js";
import Indicators from "./modules/spaceright.js";
import System from "./modules/system.js";
import Utilities from "./modules/utils.js";
import { BarButton } from "./modules/simple_button.js";
import { BarToggles } from "./modules/bar_toggles.js";
// import spaceleft from "./modules/spaceleft.js";
// import SystemResources from "./modules/resources.js"
const { GLib } = imports.gi;
const BarGroup = ({ child }) =>
  Widget.Box({
    className: "bar-group-margin bar-sides",
    children: [
      Widget.Box({
        className: "bar-group bar-group-standalone bar-group-pad-system",
        children: [child],
      }),
    ],
  });
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
  const LoneModule = (children) =>
    Widget.Box({
      children: children,
    });
  const SideModule = (children) =>
    Widget.Box({
      className: "bar-sidemodule",
      children: children,
    });

  // Function to attach corners to the bar when needed
  const attachCorners = async (barContent) => {
    if (userOptions.asyncGet().bar.position === "top") {
      // Ensure the corner widgets are resolved before adding them to the bar content
      barContent.startWidget = Widget.Box({
        children: [
          await BarCornerTopleft(monitor), // Attach top-left corner
          await BarCornerTopright(monitor), // Attach top-right corner
        ],
      });
    }
    return barContent;
  };

  // Resolve the async widgets before passing to the bar content
  const normalBarContent = await Widget.CenterBox({
    className: "bar-bg",
    setup: (self) => {
      const styleContext = self.get_style_context();
      const minHeight = styleContext.get_property(
        "min-height",
        Gtk.StateFlags.NORMAL,
      );
    },
    startWidget: await WindowTitle(monitor),
    centerWidget: Widget.Box({
      className: "spacing-h-4",
      children: [
        SideModule([Music()]),
        Widget.Box({
          homogeneous: true,
          children: [await NormalOptionalWorkspaces()],
        }),
        SideModule([System()]),
      ],
    }),
    endWidget: Indicators(monitor),
  });

  // Apply corners based on the bar mode
  const finalNormalBarContent = await attachCorners(normalBarContent);

  const floatingBarContent = await Widget.CenterBox({
    className: "bar-floating ",
    css: " min-height:50px;",
    setup: (self) => {
      const styleContext = self.get_style_context();
      const minHeight = styleContext.get_property(
        "min-height",
        Gtk.StateFlags.NORMAL,
      );
    },
    startWidget: Widget.Box({
      css: "margin-left:1.6rem;",
      className: "spacing-h-15",
      children: [
        await BatteryModule(),
        Widget.Box({
          css: "padding-left:0.7rem;",
          homogeneous: true,
          css: "margin-left:1rem;",
          children: [await FocusOptionalWorkspaces()],
        }),
        Widget.Box({
          css: "margin-left:0.4rem;",
          className: "spacing-h-10",
          children: [Utilities(), BarToggles()],
        }),
      ],
    }),
    centerWidget: Widget.Box({
      children: [
        Widget.Box({
          children: [await MusicStuff()],
        }),
      ],
    }),
    endWidget: Widget.Box({
      className: "spacing-h-5",
      children: [
        Widget.Box({
          children: [
            await Indicators(),
            Widget.Box({
              css: "margin:0rem 1rem 0rem -1.4rem;",
              children: [simpleClock()],
            }),
          ],
        }),
      ],
    }),
  });

  const notchedBarContent = await Widget.CenterBox({
    css: "min-height:44px;",
    startWidget: Widget.Box({
      homogeneous: false,
      children: [await WindowTitle()],
    }),
    centerWidget: Widget.Box({
      className: "spacing-h-15 bar-notch",
      children: [
        Widget.Box({
          children: [await FocusOptionalWorkspaces()],
        }),
      ],
    }),
    endWidget: Widget.Box({
      children: [
        Widget.Box({
          css: "margin-right:-1.5rem;",
          children: [Indicators()],
        }),
        Widget.Box({
          css: "padding-right:2rem;",
          children: [simpleClock()],
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
      transitionDuration: userOptions.asyncGet().animations.durationLarge,
      children: {
        normal: finalNormalBarContent, // Use resolved bar content with corners
        nothing: floatingBarContent,
        focus: notchedBarContent,
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
