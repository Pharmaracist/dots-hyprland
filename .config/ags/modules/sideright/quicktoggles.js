const { GLib } = imports.gi;
import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
const { execAsync, exec } = Utils;
import {
  BluetoothIndicator,
  NetworkIndicator,
} from "../.commonwidgets/statusicons.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { sidebarOptionsStack } from "./sideright.js";

// Кэшируем часто используемые значения
const userOpts = userOptions.asyncGet();
const configDir = App.configDir;

export const ToggleIconWifi = (props = {}) => {
  const networkLabel = Widget.Label({
    label: "WiFi",
    className: "toggle-label",
    hpack: "start",
    hexpand: true,
  });

  const button = Widget.Button({
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Wifi | Right-click to configure"),
    onClicked: Network.toggleWifi,
    onSecondaryClickRelease: () => {
      execAsync(["bash", "-c", userOpts.apps.network]).catch(print);
      closeEverything();
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        NetworkIndicator(),
        networkLabel,
      ],
    }),
    setup: (self) => {
      setupCursorHover(self);
      self.hook(Network, (button) => {
        const isConnected = [
          Network.wifi?.internet,
          Network.wired?.internet,
        ].includes("connected");
        button.toggleClassName("sidebar-button-active", isConnected);
        networkLabel.toggleClassName("toggle-label-active", isConnected);
        button.tooltipText = `${Network.wifi?.ssid || getString("Unknown")} | ${getString("Right-click to configure")}`;
        networkLabel.label = Network.wifi?.ssid || "WiFi";
      });
    },
    ...props,
  });
  return button;
};

export const ToggleIconBluetooth = (props = {}) => {
  const bluetoothLabel = Widget.Label({
    label: "Bluetooth",
    className: "toggle-label",
    hpack: "start",
    hexpand: true,
  });

  const button = Widget.Button({
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Bluetooth | Right-click to configure"),
    onClicked: () => {
      Bluetooth.enabled = !Bluetooth.enabled;
    },
    onSecondaryClickRelease: () => {
      execAsync(["bash", "-c", userOpts.apps.bluetooth]).catch(print);
      closeEverything();
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        BluetoothIndicator(),
        bluetoothLabel,
      ],
    }),
    setup: (self) => {
      setupCursorHover(self);
      self.hook(Bluetooth, (button) => {
        button.toggleClassName(
          "sidebar-button-active",
          Bluetooth.enabled
        );
        bluetoothLabel.toggleClassName(
          "toggle-label-active",
          Bluetooth.enabled
        );
        const connectedDevices = Bluetooth.connected_devices;
        bluetoothLabel.label = connectedDevices.length > 0 
          ? connectedDevices[0].alias 
          : "Bluetooth";
      });
    },
    ...props,
  });
  return button;
};

export const ModuleNightLight = async (props = {}) => {
  if (!exec(`bash -c 'command -v gammastep'`)) return null;

  const nightLightLabel = Widget.Label({
    label: "Night Light",
    className: "toggle-label",
    hpack: "start",
    hexpand: true,
  });

  const button = Widget.Button({
    attribute: { enabled: false },
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Night Light"),
    onClicked: async (self) => {
      self.attribute.enabled = !self.attribute.enabled;
      self.toggleClassName("sidebar-button-active", self.attribute.enabled);
      nightLightLabel.toggleClassName("toggle-label-active", self.attribute.enabled);

      if (self.attribute.enabled) {
        await execAsync("gammastep").catch(print);
      } else {
        self.sensitive = false;
        await execAsync("pkill gammastep").catch(print);
        const checkInterval = setInterval(() => {
          execAsync("pkill -0 gammastep").catch(() => {
            self.sensitive = true;
            clearInterval(checkInterval);
          });
        }, 500);
      }
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        MaterialIcon("nightlight", "norm"),
        nightLightLabel,
      ],
    }),
    setup: (self) => {
      setupCursorHover(self);
      self.attribute.enabled = !!exec("pidof gammastep");
      self.toggleClassName("sidebar-button-active", self.attribute.enabled);
      nightLightLabel.toggleClassName("toggle-label-active", self.attribute.enabled);
    },
    ...props,
  });
  return button;
};

export const ModuleIdleInhibitor = (props = {}) => {
  const scriptPath = `${configDir}/scripts/wayland-idle-inhibitor.py`;

  const idleLabel = Widget.Label({
    label: "Keep Awake",
    className: "toggle-label",
    hpack: "start",
    hexpand: true,
  });

  return Widget.Button({
    attribute: { enabled: false },
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Keep system awake"),
    onClicked: async (self) => {
      self.attribute.enabled = !self.attribute.enabled;
      self.toggleClassName("sidebar-button-active", self.attribute.enabled);
      idleLabel.toggleClassName("toggle-label-active", self.attribute.enabled);

      if (self.attribute.enabled) {
        await execAsync([
          "bash",
          "-c",
          `pidof wayland-idle-inhibitor.py || ${scriptPath}`,
        ]).catch(print);
      } else {
        await execAsync("pkill -f wayland-idle-inhibitor.py").catch(print);
      }
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        MaterialIcon("coffee", "norm"),
        idleLabel,
      ],
    }),
    setup: (self) => {
      setupCursorHover(self);
      self.attribute.enabled = !!exec("pidof wayland-idle-inhibitor.py");
      self.toggleClassName("sidebar-button-active", self.attribute.enabled);
      idleLabel.toggleClassName("toggle-label-active", self.attribute.enabled);
    },
    ...props,
  });
};

export const ModuleReloadIcon = (props = {}) => {
  const reloadLabel = Widget.Label({
    label: "Reload",
    className: "toggle-label",
    hpack: "start",
    hexpand: true,
  });

  return Widget.Button({
    ...props,
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Reload Environment config"),
    onClicked: async () => {
      reloadLabel.toggleClassName("toggle-label-active", true);
      await execAsync(["bash", "-c", "hyprctl reload || swaymsg reload &"]);
      App.closeWindow("sideright");
      reloadLabel.toggleClassName("toggle-label-active", false);
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        MaterialIcon("refresh", "norm"),
        reloadLabel,
      ],
    }),
    setup: setupCursorHover,
  });
};

export const ModulePowerIcon = (props = {}) => {
  const powerLabel = Widget.Label({
    label: "Power",
    className: "toggle-label",
    hpack: "start",
    hexpand: true,
  });

  return Widget.Button({
    ...props,
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Session"),
    onClicked: () => {
      powerLabel.toggleClassName("toggle-label-active", true);
      closeEverything();
      Utils.timeout(1, () => {
        openWindowOnAllMonitors("session");
        powerLabel.toggleClassName("toggle-label-active", false);
      });
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        MaterialIcon("power_settings_new", "norm"),
        powerLabel,
      ],
    }),
    setup: setupCursorHover,
  });
};

export const ModuleRawInput = async (props = {}) => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;

    return Widget.Button({
      className: "txt-small sidebar-iconbutton",
      tooltipText: "Raw input",
      onClicked: async (button) => {
        const output = await Hyprland.messageAsync(
          "j/getoption input:accel_profile",
        );
        const value = JSON.parse(output)["str"].trim();
        const newValue =
          value != "[[EMPTY]]" && value != "" ? "[[EMPTY]]" : "flat";

        await Hyprland.messageAsync(
          `j/keyword input:accel_profile ${newValue}`,
        ).catch(print);
        button.toggleClassName(
          "sidebar-button-active",
          newValue !== "[[EMPTY]]",
        );
      },
      child: Widget.Box({
        spacing: 8,
        hexpand: true,
        children: [
          MaterialIcon("mouse", "norm"),
          Widget.Label({
            label: "Raw Input",
            className: "toggle-label",
            hpack: "start",
            hexpand: true,
          }),
        ],
      }),
      setup: setupCursorHover,
      ...props,
    });
  } catch {
    return null;
  }
};

export const ModuleCloudflareWarp = async (props = {}) => {
  if (!exec(`bash -c 'command -v warp-cli'`)) return null;

  const button = Widget.Button({
    attribute: { enabled: false },
    className: "txt-small sidebar-iconbutton",
    tooltipText: getString("Cloudflare WARP"),
    onClicked: async (self) => {
      self.attribute.enabled = !self.attribute.enabled;
      self.toggleClassName("sidebar-button-active", self.attribute.enabled);
      await execAsync(
        `warp-cli ${self.attribute.enabled ? "connect" : "disconnect"}`,
      ).catch(print);
    },
    child: Widget.Box({
      spacing: 8,
      hexpand: true,
      children: [
        Widget.Icon({
          icon: "cloudflare-dns-symbolic",
          className: "txt-norm",
        }),
        Widget.Label({
          label: "WARP",
          className: "toggle-label",
          hpack: "start",
          hexpand: true,
        }),
      ],
    }),
    setup: (self) => {
      setupCursorHover(self);
      self.attribute.enabled = !exec(
        `bash -c 'warp-cli status | grep Disconnected'`,
      );
      self.toggleClassName("sidebar-button-active", self.attribute.enabled);
    },
    ...props,
  });
  return button;
};

export const ModuleSettingsIcon = ({ hpack = "center" } = {}) =>
  Widget.Button({
    hpack: hpack,
    className: "txt-norm icon-material sidebar-iconbutton",
    tooltipText: "AGS Settings",
    label: "settings",
    onClicked: () => {
      App.closeWindow("sideright");
      Utils.execAsync([
        "bash",
        "-c",
        `${GLib.get_home_dir()}/.local/bin/ags-tweaks`,
      ]);
    },
  });

const hyprctl = (cmd) => execAsync(["hyprctl", ...cmd.split(" ")]).catch(print);
const getHyprOption = async (opt) =>
  JSON.parse(await Utils.execAsync(`hyprctl -j getoption ${opt}`));
