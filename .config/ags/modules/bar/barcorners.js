import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";

export const BarCornerTopleft = async (monitor = 0) => Widget.Window({
    name: `bar-corner-topleft-${monitor}`,
    layer: "top",
    anchor: ["top", "left"],
    exclusivity: "normal",
    visible: true,
    child: RoundedCorner("topleft", { className: "corner" }),
    setup: enableClickthrough,
});

export const BarCornerTopright = async (monitor = 0) => Widget.Window({
    name: `bar-corner-topright-${monitor}`,
    layer: "top",
    anchor: ["top", "right"],
    exclusivity: "normal",
    visible: true,
    child: RoundedCorner("topright", { className: "corner" }),
    setup: enableClickthrough,
});
