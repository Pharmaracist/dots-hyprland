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
import Brightness from "../../../services/brightness.js";
import Indicator from "../../../services/indicator.js";

const options = userOptions.asyncGet();
const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
Utils.exec(`mkdir -p ${WEATHER_CACHE_FOLDER}`);

const BRIGHTNESS_STEP = 0.05;

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
  let status = true;

  const change_wallpaper_btn = UtilButton({
    name: getString("Change wallpaper"),
    icon: "image",
    onClicked: () => App.toggleWindow("wallselect"),
  });

  const box = Box({
    hpack: "center",
    className: "spacing-h-4",
    children: [
      UtilButton({
        name: getString("Screen snip"),
        icon: "screenshot_region",
        onClicked: () => {
          Utils.execAsync(
            `${App.configDir}/scripts/grimblast.sh copy area`,
          ).catch(print);
        },
      }),
      UtilButton({
        name: getString("Color picker"),
        icon: "colorize",
        onClicked: () => {
          Utils.execAsync(["hyprpicker", "-a"]).catch(print);
        },
      }),
      UtilButton({
        name: getString("Toggle on-screen keyboard"),
        icon: "keyboard",
        onClicked: () => {
          toggleWindowOnAllMonitors("osk");
        },
      }),
      change_wallpaper_btn,
    ],
  });
  unsubscriber = userOptions.subscribe((userOptions) => {
    wallpaperFolder = userOptions.bar.wallpaper_folder;
    const current_status = typeof wallpaperFolder == "string";
    if (status != current_status) {
      if (current_status) {
        box.add(change_wallpaper_btn);
      } else {
        box.remove(change_wallpaper_btn);
      }

      status = current_status;
    }
  });
  box.on("destroy", () => {
    unsubscriber();
  });
  return box;
};
const BarBattery = () => {
    let isRevealed = false;
  
    // Create Revealer only once
    const percentageRevealer = Revealer({
      transitionDuration: options.animations.durationLarge,
      transition: "slide_right",
      revealChild: false, // Initially hidden
      child: Label({
        className: "bar-batt-percent",
        css: "margin-left: 6px;",
        connections: [
          [
            Battery,
            (label) => {
              const chargingText = Battery.charging ? "Charging" : "Discharging";
              label.label = `${Battery.percent}% (${chargingText})`; // Show percentage and charging status
            },
          ],
        ],
      }),
    });
  
    const handleScroll = (direction) => {
      Indicator.popup(1);
      Brightness[0].screen_value += direction * BRIGHTNESS_STEP; // Adjust brightness for monitor 0
    };
  
    return Box({
      className: "spacing-h-10 bar-batt-txt",
      children: [
        EventBox({
          onScrollUp: () => handleScroll(1), // Increase brightness
          onScrollDown: () => handleScroll(-1), // Decrease brightness
          onPrimaryClick: () => {
            isRevealed = !isRevealed;
            percentageRevealer.revealChild = isRevealed;
          },
          child: Box({
            className: "bar-batt-container",
            children: [
              MaterialIcon("", "norm"),
              Overlay({
                child: Box({
                  vpack: "center",
                  className: "bar-batt",
                  homogeneous: true,
                  children: [MaterialIcon("", "small")],
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
          }),
        }),
        percentageRevealer, // Revealer added only once
      ],
    });
  };
  

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
    className: "spacing-h-4",
    children: [
      // BarGroup({ child: Utilities() }),
      Stack({
        transition: "slide_up_down",
        transitionDuration: userOptions.asyncGet().animations.durationLarge,
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
    onScrollUp: () => handleScroll(1),
    onScrollDown: () => handleScroll(-1),
    // onPrimaryClick: () => App.toggleWindow("wallselect"),
    onSecondaryClickRelease: () => Utils.exec(`zeditor`),
    onMiddleClickRelease: () => Utils.exec(`sh  ~/.local/bin/ags-tweaks`),
    child: Widget.Box({
      children: [BatteryModule()],
    }),
  });

const handleScroll = (direction) => {
  const adjustment = direction > 0 ? "10%+" : "10%-";
  Utils.execAsync(`brightnessctl set ${adjustment}`);
};
