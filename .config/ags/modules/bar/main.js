const { Gtk, GLib } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { currentShellMode } from "../../variables.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";
import { NormalBar } from "./modes/normal.js";
import { FocusBar } from "./modes/focus.js";
import { FloatingBar } from "./modes/floating.js";
import { MinimalBar } from "./modes/minimal.js";
import { AnoonBar } from "./modes/anoon.js";
import { DwmBar } from "./modes/dwm.js";

const modes = new Map([
  ["0", [NormalBar, true]],
  ["1", [FocusBar, true]],
  ["2", [FloatingBar, false]],
  ["3", [MinimalBar, true]],
  ["4", [AnoonBar, false]],
  ["5", [DwmBar, false]],
]);

const shouldShowCorners = (monitor) => {
  const mode = currentShellMode.value[monitor] || "0";
  return modes.get(mode)?.[1] ?? false;
};

const createCorner = (monitor, side) => {
  const opts = userOptions.asyncGet();
  return Widget.Window({
    monitor,
    name: `barcorner${side[0]}${monitor}`,
    layer: "top",
    anchor: [opts.bar.position, side],
    exclusivity: "normal",
    visible: shouldShowCorners(monitor),
    child: RoundedCorner(
      `${opts.bar.position === "top" ? "top" : "bottom"}${side}`,
      { className: "corner" },
    ),
    setup: self => {
      enableClickthrough(self);
      self.hook(currentShellMode, () => {
        self.visible = shouldShowCorners(monitor);
      });
    },
  });
};

export const BarCornerTopleft = (monitor = 0) => createCorner(monitor, "left");
export const BarCornerTopright = (monitor = 0) => createCorner(monitor, "right");

export const Bar = async (monitor = 0) => {
  const opts = userOptions.asyncGet();
  const mode = currentShellMode.value[monitor] || "0";
  const barPosition = opts.bar.position;
  const showCorners = shouldShowCorners(monitor);
  
  const corners = ["left", "right"].map(side => createCorner(monitor, side));
  
  const stack = Widget.Stack({
    homogeneous: false,
    transition: "slide_up_down",
    transitionDuration: opts.animations.durationSmall,
    shown: mode,
    children: Object.fromEntries([...modes].map(([k, [component]]) => [k, component])),
    setup: self => self.hook(currentShellMode, () => {
      const mode = currentShellMode.value[monitor] || "0";
      self.shown = mode;
    }),
  });

  const bar = Widget.Window({
    monitor,
    name: `bar${monitor}`,
    anchor: [barPosition, "right", "left"],
    exclusivity: "exclusive",
    visible: true,
    child: stack,
  });

  return [bar, ...corners];
};
