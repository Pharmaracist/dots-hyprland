const { Gtk } = imports.gi;
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
const { Box, Label, Button, Overlay, Revealer, Scrollable, Stack, EventBox } =
  Widget;
const { exec, execAsync } = Utils;
// Define the button component
export const BarButton = ({
  label = "\udb82\udcc7 ",
  onPrimaryClick = () => Utils.App.toggleWindow("overview"),
} = {}) =>
  Widget.EventBox({
    // css: "min-height:30px;min-width:30px;",
    className: "txt-hugerass icon-nerd prim-txt",
    child: Widget.Label({
      label,
    }),
    onPrimaryClick,
  });
