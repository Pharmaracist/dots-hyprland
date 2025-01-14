const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { SideModule } from "./../../.commonwidgets/sidemodule.js";
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
export const FocusOptionalWorkspaces = async () => {
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
export const FocusBar = Widget.CenterBox({ //focus mode
  className: "bar-bg-focus",
  css:`min-height:1.8rem`,
  startWidget: Widget.EventBox({
    css:`min-width:5rem`,
    onPrimaryClick: () => {
      App.toggleWindow("sideleft");
    },
  }),
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
  endWidget: Widget.EventBox({
    css: `min-width:5rem`,
    onPrimaryClick: () => {
      App.toggleWindow("sideright");
    },
  }),
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