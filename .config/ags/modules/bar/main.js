const { Gtk, GLib } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { NormalBar } from "./modes/normal.js";
import { FocusBar } from "./modes/focus.js";
import { FloatingBar } from "./modes/floating.js";
import { AnoonBar } from "./modes/anoon.js";
import { MinimalBar } from "./modes/minimal.js";
import { DwmBar } from "./modes/dwm.js";
export const Bar = async (monitor = 0) => {
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
        "0": NormalBar,
        "1": FocusBar,
        "2": FloatingBar,
        "3": MinimalBar,
        "4": AnoonBar,
        "5": DwmBar,
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
      return mode === "0" || mode === "1" || mode === "3"; // Added mode "1"
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
      return mode === "0" || mode === "1" || mode === "3";
    }),
    child: RoundedCorner(
      userOptions.asyncGet().bar.position === "top"
        ? "topright"
        : "bottomright",
      { className: "corner" },
    ),
    setup: enableClickthrough,
  });
