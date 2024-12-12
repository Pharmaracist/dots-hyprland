import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Label, Button, Overlay, Revealer, Scrollable, Stack, EventBox } =
  Widget;
const { exec, execAsync } = Utils;
const { GLib } = imports.gi;
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import {
  WWO_CODE,
  WEATHER_SYMBOL,
  NIGHT_WEATHER_SYMBOL,
} from "../../.commondata/weather.js";

const options = userOptions.asyncGet();
const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
Utils.exec(`mkdir -p ${WEATHER_CACHE_FOLDER}`);

const batteryProgressCache = new Map();
const BarBatteryProgress = () => {
  const _updateProgress = (circprog) => {
    const percent = Battery.percent;
    const key = `${percent}-${Battery.charged}`;

    if (!batteryProgressCache.has(key)) {
      const css = `font-size: ${Math.abs(percent)}px;`;
      batteryProgressCache.set(key, css);
    }

    circprog.css = batteryProgressCache.get(key);
    circprog.toggleClassName(
      "bar-batt-circprog-low",
      percent <= options.battery.low,
    );
    circprog.toggleClassName("bar-batt-circprog-full", Battery.charged);
  };

  return AnimatedCircProg({
    className: "bar-batt-circprog",
    vpack: "center",
    hpack: "center",
    extraSetup: (self) => self.hook(Battery, _updateProgress),
  });
};

const timeFormat = options.time.format;
const dateFormat = options.time.dateFormatLong;

const time = Variable("", {
  poll: [
    options.time.interval,
    () => GLib.DateTime.new_now_local().format(timeFormat),
  ],
});

const date = Variable("", {
  poll: [
    options.time.dateInterval,
    () => GLib.DateTime.new_now_local().format(dateFormat),
  ],
});

const BarClock = () =>
  Widget.Box({
    vpack: "center",
    className: "spacing-h-4 bar-clock-box",
    children: [
      Widget.Label({
        className: "bar-time",
        label: time.bind(),
      }),
      Widget.Label({
        className: "txt-norm txt-onLayer1",
        label: "•",
      }),
      Widget.Label({
        className: "txt-smallie bar-date",
        label: date.bind(),
      }),
    ],
  });

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
  let unsubscriber = () => {};
  let wallpaperFolder = "";
  let showWallpaperButton = false;  // More descriptive variable name

  const changeWallpaperButton = Widget.Button({
    vpack: "center",
    tooltipText: getString("Change wallpaper"),
    onClicked: () => App.toggleWindow("wallselect"),
    className: "bar-util-btn icon-material txt-norm",
    label: "image",
  });

 const screenSnipButton = Widget.Button({
    vpack: "center",
    tooltipText: getString("Screen snip"),
    onClicked: () => {
      Utils.execAsync(
        `${App.configDir}/scripts/grimblast.sh copy area`,
      ).catch(print);
    },
    className: "bar-util-btn icon-material txt-norm",
    label: "screenshot_region",
  });

  const colorPickerButton = Widget.Button({
    vpack: "center",
    tooltipText: getString("Color picker"),
    onClicked: () => {
      Utils.execAsync(["hyprpicker", "-a"]).catch(print);
    },
    className: "bar-util-btn icon-material txt-norm",
    label: "colorize",
  });


  const keyboardButton = Widget.Button({
    vpack: "center",
    tooltipText: getString("Toggle on-screen keyboard"),
    onClicked: () => {
      App.toggleWindow("osk"); // Use App.toggleWindow for consistency.  If you have a custom function, replace this.
    },
    className: "bar-util-btn icon-material txt-norm",
    label: "keyboard",
  });


  const box = Box({
    hpack: "center",
    className: "spacing-h-4",
    children: [
      screenSnipButton,
      colorPickerButton,
      keyboardButton,
    ],
  });

  unsubscriber = userOptions.subscribe((options) => {
    wallpaperFolder = options.bar.wallpaper_folder;
    const shouldShow = typeof wallpaperFolder === "string";

    if (shouldShow !== showWallpaperButton) {
      showWallpaperButton = shouldShow;
      if (shouldShow) {
        box.add(changeWallpaperButton);
      } else {
        box.remove(changeWallpaperButton);
      }
    }
  });

  box.on("destroy", unsubscriber);
  return box;
};
const BarBattery = () =>
  Box({
    className: "spacing-h-4 bar-batt-txt",
    children: [
      Revealer({
        transitionDuration: userOptions.asyncGet().animations.durationSmall,
        revealChild: false,
        transition: "slide_right",
        child: MaterialIcon("bolt", "norm", { tooltipText: "Charging" }),
        setup: (self) =>
          self.hook(Battery, (revealer) => {
            self.revealChild = Battery.charging;
          }),
      }),
      Label({
        className: "txt-smallie",
        setup: (self) =>
          self.hook(Battery, (label) => {
            label.label = `${Number.parseFloat(Battery.percent.toFixed(1))}%`;
          }),
      }),
      Overlay({
        child: Widget.Box({
          vpack: "center",
          className: "bar-batt",
          homogeneous: true,
          children: [MaterialIcon("battery_full", "small")],
          setup: (self) =>
            self.hook(Battery, (box) => {
              box.toggleClassName(
                "bar-batt-low",
                Battery.percent <= userOptions.asyncGet().battery.low,
              );
              box.toggleClassName("bar-batt-full", Battery.charged);
            }),
        }),
        overlays: [BarBatteryProgress()],
      }),
    ],
  });

const BarGroup = ({ child }) =>
  Widget.Box({
    className: "bar-group-margin bar-sides",
    children: [
      Widget.Box({
        className: "bar-group bar-group-standalone bar-group-pad-system",
        children: [child],
      }),
    ],
  });

const BatteryModule = () =>
  Box({
    className: "spacing-h-5",
    children: [
      BarGroup({ child: BarClock() }),
      BarGroup({ child:Utilities() }),
      Stack({
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
        transition: "slide_up_down",
        children: {
          laptop: BarGroup({ child: BarBattery() }),
          hidden: Widget.Box({}),
        },
        setup: (stack) => {
          stack.hook(globalThis.devMode, () => {
            if (globalThis.devMode.value) {
              stack.shown = "laptop";
            } else {
              if (!Battery.available) stack.shown = "hidden";
              else stack.shown = "laptop";
            }
          });
        },
      }),
    ],
  });

const switchToRelativeWorkspace = async (self, num) => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;
    Hyprland.messageAsync(
      `dispatch workspace ${num > 0 ? "+" : ""}${num}`,
    ).catch(print);
  } catch {
    execAsync([
      `${App.configDir}/scripts/sway/swayToRelativeWs.sh`,
      `${num}`,
    ]).catch(print);
  }
};

export default () =>
  Widget.EventBox({
    onScrollUp: (self) => switchToRelativeWorkspace(self, -1),
    onScrollDown: (self) => switchToRelativeWorkspace(self, +1),
    onPrimaryClick: () => App.toggleWindow("sideright"),
    child: Widget.Box({
      className: "spacing-h-4",
      children: [BatteryModule()],
    }),
  });
