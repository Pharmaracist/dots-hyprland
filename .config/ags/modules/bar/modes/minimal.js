const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Indicators from "../normal/spaceright.js";
import BarBattery from "../modules/battery.js";
import ScrolledModule from "../../.commonwidgets/scrolledmodule.js";
import NormalOptionalWorkspaces  from "../normal/workspaces_hyprland.js";
import FocusOptionalWorkspaces  from "../normal/workspaces_hyprland.js";
import Utils from "../modules/utils.js";
const expand = () => Widget.Box({ hexpand: true, css: "min-height:0.5rem" });
export const MinimalBar = Widget.CenterBox({
  className: "bar-bg",
//   css: "min-height:2rem",`
  startWidget: Widget.Box({
    css: "margin-left:1.8rem;",
    children: [
      BarBattery(),
      ScrolledModule({
        children: [
          ...(userOptions.asyncGet().bar.elements.showWorkspaces ? [await NormalOptionalWorkspaces()] : []),
          ...(userOptions.asyncGet().bar.elements.showWorkspaces ? [await FocusOptionalWorkspaces()] : []),
        ],
      }),
    ],
  }),
  // centerWidget: music(),
  endWidget:
  Widget.Box({
    children:[
    //   expand(),
      ScrolledModule({
        children: [
          ...(userOptions.asyncGet().bar.elements.showIndicators ? [Indicators()] : []),
          Widget.Box({ hexpand: true, css: "margin-right:1.5rem",hpack:"end",child:Utils() }),
        ],
      }),
    ]
  })
});