const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import WindowTitle from "../normal/spaceleft.js";
import Music from "../normal/mixed.js";
import System from "../normal/system.js";
import Indicators from "../normal/spaceright.js";
import avatar from "../modules/avatar.js";
import { SideModule } from "../../.commonwidgets/sidemodule.js";
import ScrolledModule from "../../.commonwidgets/scrolledmodule.js";
import Clock from "../modules/clock.js";
import BatteryScaleModule from "../normal/battery_scale.js";
const NormalOptionalWorkspaces = async () => {
  try {
    return (await import("../normal/workspaces_hyprland.js")).default();
  } catch {
    try {
      return (await import("../normal/workspaces_sway.js")).default();
    } catch {
      return null;
    }
  }
};

const FocusOptionalWorkspaces = async () => {
  try {
    return (await import("../focus/workspaces_hyprland.js")).default();
  } catch {
    try {
      return (await import("../focus/workspaces_sway.js")).default();
    } catch {
      return null;
    }
  }
};
const expand = () => Widget.Box({ hexpand: true, css: "min-height:0.5rem" });

export const FloatingBar = Widget.CenterBox({
  className: "bar-floating",
  css: "min-height:2.4rem;padding:0.3rem 0",
  startWidget: Widget.Box({
    css: "margin-left:1.8rem;",
    children: [
      ScrolledModule({
        children: [
          ...(userOptions.asyncGet().bar.elements.showWorkspaces ? [await NormalOptionalWorkspaces()] : []),
          ...(userOptions.asyncGet().bar.elements.showWorkspaces ? [await FocusOptionalWorkspaces()] : []),
        ],
      }),
    ],
  }),
  centerWidget: ScrolledModule({
    children: [
      ...(userOptions.asyncGet().bar.elements.showClock ? [Clock()] : []),
      expand(),
      Widget.Box({ children: [expand(),BatteryScaleModule()] }),
    ],
  }),
  endWidget:
  Widget.Box({
    children:[
      expand(),
      ScrolledModule({
        children: [
          ...(userOptions.asyncGet().bar.elements.showIndicators ? [Indicators()] : []),
        ],
      }),
    ]
  })
});