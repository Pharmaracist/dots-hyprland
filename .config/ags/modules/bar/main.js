const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import BatteryModule from "./modules/battery.js";
import BarClock from "./modules/clock.js";
import BarToggles from "./modules/bar_toggles.js";
import Music from "./modules/mixed.js";
import MusicStuff from "./modules/music.js";
import PowerDrawWidget from "./modules/powerdraw.js";
import { BarButton } from "./modules/simple_button.js";
import simpleClock from "./modules/simple_clock.js";
import WindowTitle from "./modules/spaceleft.js";
import Indicators from "./modules/spaceright.js";
import System from "./modules/system.js";
import Shortcuts from "./modules/utils.js";
import ClassWindow from "./modules/window_title.js";
import SystemResources from "./modules/resources.js";

// import spaceleft from "./modules/spaceleft.js";
const attachCorners = async (barContent) => {
  // Ensure the bar position is top, and then attach the corners within the Stack
  if (userOptions.asyncGet().bar.position === "top") {
    const topLeftCorner = await BarCornerTopleft();
    const topRightCorner = await BarCornerTopright();

    // Add corners within the layout structure by placing them in separate windows
    barContent = Widget.Stack({
      homogeneous: false,
      children: [
        barContent, // Add original content
        topLeftCorner, 
        topRightCorner,
      ],
    });
  }

  return barContent;
};

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

const separator = () =>
  Widget.Box({
    vpack: "center",
    className: "margin-rl-10 sec-txt txt-norm",
    children: [
      Widget.Label({
        label: "|",
      }),
    ],
  });
  
export const Bar = async (monitor = 0) => {
  const LargeSideModule = (children) =>
    Widget.Box({
      className: "bar-largesidemodule",
      children: children,
    });
    const NormSideModule = (children) =>
      Widget.Box({
        className: "bar-normsidemodule margin-rl-5",
        children: children,
      });
      const SmallSideModule = (children) =>
        Widget.Box({
          className: "bar-smallsidemodule",
          children: children,
        });
        const MarginSideModule = (children) =>
          Widget.Box({
            className: "margin-rl-10",
            children: children,
          });

  const normalBarContent = await Widget.CenterBox({
    className: "bar-bg",
    setup: (self) => {
      const styleContext = self.get_style_context();
    },
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
  const finalNormalBarContent = await attachCorners(normalBarContent);

  const floatingBarContent = await Widget.CenterBox({
    className: "bar-floating ",
    css: "min-height:3rem;",
    startWidget: Widget.Box({
      className: "start-widget",
      children: [
        await BatteryModule(),
       MarginSideModule([await FocusOptionalWorkspaces()])
      ],
    }),
    centerWidget:SmallSideModule([MusicStuff()]),
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
  const hangedBarContent = await Widget.CenterBox({
    className: "bar-hang",
    css: "min-height:3rem;",
    startWidget: Widget.Box({
      className: "start-widget",
      children: [
        await BatteryModule(),
        NormSideModule([await FocusOptionalWorkspaces()]),
        await Shortcuts(),
      ]
    }),
    centerWidget:BarClock(),
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
  const minimalBarContent = await Widget.CenterBox({
    className: "bar-bg ",
    setup: (self) => {
      const styleContext = self.get_style_context();
    },
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
      className:"end-widget",
      children:[
      await Indicators()
      ]
    }),
    });
  const finalMinimalBarContent = await attachCorners(minimalBarContent);
  const notchedBarContent = await Widget.CenterBox({
    css: "min-height:3.5rem",
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
      className:"end-widget",
      children: [
       await Indicators()
      ],
    }),
  });
  const nothingContent = Widget.Box({
    className: "bar-bg-nothing",
  });


  return Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: [userOptions.asyncGet().bar.position, "right", "left"],
    exclusivity: "exclusive",
    visible: true,
    layer:"top",
    child: Widget.Stack({
      homogeneous: false,
      transition: "slide_up_down",
      transitionDuration: userOptions.asyncGet().animations.durationSmall,
      children: {
        mode1: floatingBarContent,
        mode2: notchedBarContent,
        mode3: nothingContent,
        mode4: hangedBarContent,
        mode5: finalNormalBarContent, // Now has corners attached
        mode6: finalMinimalBarContent,
        
      },
      setup: (self) => {
        self.hook(currentShellMode, (self) => {
          self.shown = currentShellMode.value[monitor];
        });
      },
    }),
  });
};

export const BarCornerTopleft = (monitor = 0) =>
  Widget.Window({
    monitor,
    name: `barcornertl${monitor}`,
    anchor: ["top", "left"],  // Anchor to top-left
    exclusivity: "normal",
    visible: true,
    layer:"bottom",
    child: RoundedCorner("topleft", { className: "corner" }),
    setup: enableClickthrough,
  });

export const BarCornerTopright = (monitor = 0) =>
  Widget.Window({
    monitor,
    name: `barcornertr${monitor}`,
    anchor: ["top", "right"],  // Anchor to top-right
    exclusivity: "normal",
    visible: true,
    child: RoundedCorner("topright", { className: "corner" }),
    setup: enableClickthrough,
  });