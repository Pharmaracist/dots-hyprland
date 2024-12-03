import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Button } = Widget;

const utilButtonCache = new Map();
const UtilButton = ({ name, icon, onClicked }) => {
  const key = `${name}-${icon}`;
  if (!utilButtonCache.has(key)) {
    utilButtonCache.set(
      key,
      Button({
        vpack: "center",
        tooltipText: name,
        onClicked: onClicked,
        className: "bar-util-btn icon-material txt-norm",
        label: `${icon}`,
      }),
    );
  }
  return utilButtonCache.get(key);
};

const Utilities = () => {
  const change_wallpaper_btn = UtilButton({
    name: getString("Change wallpaper"),
    icon: "image",
    onClicked: () => App.toggleWindow("wallselect"),
  });

  return Box({
    hpack: "center",
    className: "spacing-h-4",
    children: [
      // UtilButton({
      //   name: getString("Screen snip"),
      //   icon: "screenshot_region",
      //   onClicked: () => {
      //     Utils.execAsync(
      //       `${App.configDir}/scripts/grimblast.sh copy area`,
      //     ).catch(print);
      //   },
      // }),
      UtilButton({
        name: getString("Color picker"),
        icon: "colorize",
        onClicked: () => {
          Utils.execAsync(["hyprpicker", "-a"]).catch(print);
        },
      }),
      // UtilButton({
      //   name: getString("Toggle on-screen keyboard"),
      //   icon: "keyboard",
      //   onClicked: () => {
      //     toggleWindowOnAllMonitors("osk");
      //   },
      // }),
      change_wallpaper_btn,
    ],
  });
};

export default () =>
  Widget.EventBox({
    child: Widget.Box({
      children: [Utilities()],
    }),
  });
