const { Gtk } = imports.gi;
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
const { Box, Label, Button, Overlay, Revealer, Scrollable, Stack, EventBox } =
  Widget;
const { exec, execAsync } = Utils;
// Define the button component
export const BarButton = ({
  label = "power", // Material icon name
  onPrimaryClick = () => Utils.execAsync(`obsidian`),
} = {}) =>
  Widget.EventBox({
    className: "icon-material prim-txt txt-larger",
    child: Widget.Label({
      label,
    }),
    onPrimaryClick,
  });
