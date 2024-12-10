const { Gtk } = imports.gi;
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
export const BarButton = ({
  label = "\u23fb ",
  onPrimaryClick = () => {
    closeEverything();
    Utils.timeout(1, () => openWindowOnAllMonitors("session"));
  },
} = {}) =>
  Widget.EventBox({
    className: "txt-larger  icon-nerd sec-txt",
    child: Widget.Label({
      label,
    }),
    onPrimaryClick,
  });
