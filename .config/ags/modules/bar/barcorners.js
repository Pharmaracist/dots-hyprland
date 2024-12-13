import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { RoundedCorner } from "../.commonwidgets/cairo_roundedcorner.js";
import { enableClickthrough } from "../.widgetutils/clickthrough.js";

export const BarCornerTopleft = (visible = false) => Widget.Window({
    name: 'bar-corner-topleft',
    layer: "top",
    anchor: ["top", "left"],
    exclusivity: "normal",
    visible: visible,
    child: RoundedCorner("topleft", { className: "corner" }),
    setup: enableClickthrough,
});

export const BarCornerTopright = (visible = false) => Widget.Window({
    name: 'bar-corner-topright',
    layer: "top",
    anchor: ["top", "right"],
    exclusivity: "normal",
    visible: visible,
    child: RoundedCorner("topright", { className: "corner" }),
    setup: enableClickthrough,
});
