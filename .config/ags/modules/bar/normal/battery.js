import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Label, Overlay, Revealer, EventBox } = Widget;
const { GLib } = imports.gi;
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import Brightness from "../../../services/brightness.js"; // Assuming the brightness service is imported
import Indicator from "../../../services/indicator.js"; // Assuming Indicator is used for popup

const options = userOptions.asyncGet();

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
const BarBattery = () => {
  let isRevealed = false;

  // Create Revealer only once
  const percentageRevealer = Revealer({
    transitionDuration: options.animations.durationLarge,
    transition: "slide_right",
    revealChild: false, // Initially hidden
    child: Label({
      className: "bar-batt-percent txt-small",
      css: "margin-left: 6px;",
      connections: [
        [
          Battery,
          (label) => {
            const chargingText = Battery.charging ? "" : "";
            label.label = `${Battery.percent}% ${chargingText}`; // Show percentage and charging status
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
        onHover: () => {
          isRevealed = !isRevealed;
          percentageRevealer.revealChild = isRevealed;
        },
        child: Box({
          className: "bar-batt-container",
          children: [
            // MaterialIcon("", "norm"),
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

const BatteryModule = () =>
  Box({
    className: "spacing-h-4",
    children: [BarBattery()],
  });

export default () =>
  Widget.EventBox({
    onPrimaryClick: () => App.toggleWindow("sideleft"),
    onMiddleClick: () => Utils.exec(`obsidian`),
    onSecondaryClick: () => Utils.execAsync(`ags run-js 'cycleMode();'`),
    child: Box({
      children: [BatteryModule()],
    }),
  });
