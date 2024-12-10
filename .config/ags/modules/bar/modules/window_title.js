import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Brightness from "../../../services/brightness.js";
import Indicator from "../../../services/indicator.js";
import GLib from "gi://GLib";

const BRIGHTNESS_STEP = 0.05;
const DEFAULT_WORKSPACE_LABEL = "";

const ClassWindow = async () => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;

    const topLabel = Widget.Label({
      className: "wintitle sec-txt txt-semibold",
      setup: (self) =>
        self.hook(Hyprland.active.client, () => {
          self.label = Hyprland.active.client.class || DEFAULT_WORKSPACE_LABEL;
        }),
    });

    return topLabel;
  } catch {
    return null;
  }
};

export default async (monitor = 0) => {
  const topLabelInstance = await ClassWindow();

  const handleScroll = (direction) => {
    Indicator.popup(1);
    Brightness[monitor].screen_value += direction * BRIGHTNESS_STEP;
  };

  return Widget.EventBox({
    onScrollUp: () => handleScroll(1),
    onScrollDown: () => handleScroll(-1),
    onPrimaryClick: () => App.toggleWindow("sideleft"),
    child: Widget.Box({
      children: [
        Widget.Box({
          // className: "bar-sidemodule",
          children: [
            Widget.Box({
              children: [topLabelInstance],
            }),
          ],
        }),
      ],
    }),
  });
};
