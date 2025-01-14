const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import WindowTitle from "../normal/spaceleft.js";
import Music from "../normal/mixed.js";
import System from "../normal/system.js";
import Indicators from "../normal/spaceright.js";
import avatar from "../modules/avatar.js";
import { SideModule } from "./../../.commonwidgets/sidemodule.js";

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

export const NormalBar = Widget.CenterBox({
  className: "bar-bg",
  css: `padding:0 1rem`,
  startWidget: Widget.Box({
    className: "spacing-h-4",
    children: [
      ...(userOptions.asyncGet().bar.elements.showWindowTitle ? [await WindowTitle()] : []),
    ]
  }),
  centerWidget: Widget.Box({
    children: [
      SideModule([...(userOptions.asyncGet().bar.elements.showMusic ? [await Music(
)] : [])]),
      Widget.Box({
        css: `padding:0 8px;margin: 4px 5px`,
        className: "bar-group bar-group-standalone",
        children: [...(userOptions.asyncGet().bar.elements.showWorkspaces ? [await NormalOptionalWorkspaces()] : [])]
      }),
      SideModule([System()]),
    ],
  }),
  endWidget: Widget.Box({
    children: [
      await Indicators(),
      ...(userOptions.asyncGet().bar.elements.showAvatar ? [avatar()] : [])
    ]
  }),
});
