import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";

export const BarCornerTopleft = async () => Widget.Window({
    name: `bar-corner-topleft`,
    layer: "top",
    keymode: "on-demand",
    anchor: ["top", "left"],
    exclusivity: "normal",
    visible: true,
    child: RoundedCorner("topleft", { className: "corner" }),
    setup: enableClickthrough,
});

export const BarCornerTopright = async () => Widget.Window({
    name: `bar-corner-topright`,
    layer: "top",
    keymode: "on-demand",
    anchor: ["top", "right"],
    exclusivity: "normal",
    visible: true,
    child: RoundedCorner("topright", { className: "corner" }),
    setup: enableClickthrough,
});
