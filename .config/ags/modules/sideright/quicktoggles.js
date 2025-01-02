const { GLib } = imports.gi;
import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
const { Box, Button } = Widget;
const { execAsync, exec } = Utils;

import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import {
  BluetoothIndicator,
  NetworkIndicator,
} from "../.commonwidgets/statusicons.js";
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { MaterialIcon } from "../.commonwidgets/materialicon.js"; 
import { sidebarOptionsStack } from "./sideright.js";
import Variable from "resource:///com/github/Aylur/ags/variable.js";
import Service from "resource:///com/github/Aylur/ags/service.js";

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

export const ModuleNightLight = (props = {}) => {
  if (!exec(`bash -c 'command -v gammastep'`)) return null;

  const button = Widget.Button({
    ...props,
    className: "txt-norm icon-material sidebar-squareiconbutton",
    tooltipText: getString("Night Light"),
    onClicked: () => {
      execAsync(['pidof', 'gammastep'])
        .then(() => {
          execAsync(['pkill', 'gammastep']).catch(print);
          button.toggleClassName("sidebar-button-active", false);
        })
        .catch(() => {
          execAsync(['gammastep']).catch(print);
          button.toggleClassName("sidebar-button-active", true);
        });
    },
    child: Widget.Label({
      className: "icon-material",
      label: "nightlight",
    }),
    setup: (self) => {
      setupCursorHover(self);
      execAsync(['pidof', 'gammastep'])
        .then(() => self.toggleClassName("sidebar-button-active", true))
        .catch(() => self.toggleClassName("sidebar-button-active", false));
    },
  });
  return button;
};

export const ModuleIdleInhibitor = (props = {}) => {
  const button = Widget.Button({
    ...props,
    className: "txt-norm icon-material sidebar-squareiconbutton",
    tooltipText: getString("Keep system awake"),
    onClicked: () => {
      execAsync(['pidof', 'caffeine'])
        .then(() => {
          execAsync(['pkill', 'caffeine']).catch(print);
          button.toggleClassName("sidebar-button-active", false);
        })
        .catch(() => {
          execAsync(['caffeine']).catch(print);
          button.toggleClassName("sidebar-button-active", true);
        });
    },
    child: Widget.Label({
      className: "icon-material",
      label: "coffee",
    }),
    setup: (self) => {
      setupCursorHover(self);
      execAsync(['pidof', 'caffeine'])
        .then(() => self.toggleClassName("sidebar-button-active", true))
        .catch(() => self.toggleClassName("sidebar-button-active", false));
    },
  });
  return button;
};

export const ModuleRawInput = (props = {}) => {
  const button = Widget.Button({
    ...props,
    className: "txt-norm icon-material sidebar-squareiconbutton",
    tooltipText: getString("Raw input"),
    onClicked: () => {
      execAsync(['hyprctl', 'getoption', 'input:force_no_accel'])
        .then(output => {
          const parsed = JSON.parse(output);
          const newValue = parsed.int !== 1;
          execAsync(['hyprctl', 'keyword', 'input:force_no_accel', newValue ? '1' : '0'])
            .catch(print);
          button.toggleClassName("sidebar-button-active", newValue);
        })
        .catch(print);
    },
    child: Widget.Label({
      className: "icon-material",
      label: "mouse",
    }),
    setup: (self) => {
      setupCursorHover(self);
      execAsync(['hyprctl', 'getoption', 'input:force_no_accel'])
        .then(output => {
          const parsed = JSON.parse(output);
          self.toggleClassName("sidebar-button-active", parsed.int === 1);
        })
        .catch(print);
    },
  });
  return button;
};

export const ModuleSettingsIcon = (props = {}) => Widget.Button({
  ...props,
  className: "txt-norm icon-material sidebar-squareiconbutton",
  tooltipText: getString("AGS Settings"),
  child: Widget.Label({
    className: "icon-material",
    label: "settings",
  }),
  onClicked: () => {
    App.openWindow("settings-dialog");
    App.closeWindow("sideright");
  },
  setup: setupCursorHover,
});

export const ModuleReloadIcon = (props = {}) => {
  const reloadLabel = Widget.Label({
    label: "Reload",
    className: "txt-norm icon-material sidebar-squareiconbutton",
    hpack: "start",
    hexpand: true,
  });

  return Widget.Button({
    ...props,
    className: "txt-norm icon-material sidebar-squareiconbutton",
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
    className: "txt-norm icon-material sidebar-iconbutton",
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

export const ModuleCloudflareWarp = async (props = {}) => {
  if (!exec(`bash -c 'command -v warp-cli'`)) return null;

  const button = Widget.Button({
    attribute: { enabled: false },
    className: "txt-norm icon-material sidebar-squareiconbutton",
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

export const SecondaryButton = ({ icon, label, tooltip, onClicked }) => Widget.Button({
    className: ' sidebar-squareiconbutton',
    tooltipText: getString(tooltip),
    onClicked: onClicked,
    child: MaterialIcon(icon, "larger"),
    setup: setupCursorHover,
});

export const MinimalPreset = () => SecondaryButton({
    icon: "mindfulness",
    tooltip: "Focus Mode - Productive environment",
    onClicked: () => globalThis.applyPreset("focus"),
});

export const FocusPreset = () => SecondaryButton({
  icon: "filter_1",
  tooltip: "Minimal preset - Only essential modules",
  onClicked: () => globalThis.applyPreset("minimal"),
});

export const GamingPreset = () => SecondaryButton({
    icon: "sports_esports",
    tooltip: "Gaming preset - Optimized for gaming",
    onClicked: () => globalThis.applyPreset("gaming"),
});

export const FullPreset = () => SecondaryButton({
    icon: "view_module",
    tooltip: "Full preset - All modules enabled",
    onClicked: () => globalThis.applyPreset("full"),
});

export const NightLightButton = () => SecondaryButton({
    icon: "nightlight",
    tooltip: "Toggle Night Light",
    onClicked: () => execAsync(['wlsunset', '-t', '4500']).catch(print),
});

export const IdleInhibitorButton = () => SecondaryButton({
    icon: "coffee",
    tooltip: "Keep system awake",
    onClicked: () => execAsync(['systemctl', 'suspend']).catch(print),
});

export const CloudflareWarpButton = () => SecondaryButton({
    icon: "vpn_lock",
    tooltip: "Toggle Cloudflare WARP",
    onClicked: () => execAsync(['warp-cli', 'connect']).catch(print),
});

class RevealerService extends Service {
    static {
        Service.register(this, {
            'state-changed': ['boolean'],
        });
    }

    constructor() {
        super();
        this._state = Variable({
            primaryRevealed: true,
            secondaryRevealed: false
        });
        this._primaryRevealers = new Set();
        this._secondaryRevealers = new Set();
    }

    get state() { return this._state; }
    get isSecondaryRevealed() { return this._state.value.secondaryRevealed; }
    get isPrimaryRevealed() { return this._state.value.primaryRevealed; }

    toggleSecondary() {
        if (!this.isPrimaryRevealed) return;
        
        const newState = { ...this._state.value };
        newState.secondaryRevealed = !newState.secondaryRevealed;
        this._state.value = newState;
        
        this._secondaryRevealers.forEach(revealer => {
            revealer.revealChild = newState.secondaryRevealed;
        });
        this.emit('state-changed', newState.secondaryRevealed);
    }

    togglePrimary() {
        const newState = { ...this._state.value };
        newState.primaryRevealed = !newState.primaryRevealed;
        
        if (!newState.primaryRevealed) {
            newState.secondaryRevealed = false;
            this._secondaryRevealers.forEach(revealer => {
                revealer.revealChild = false;
            });
        }
        
        this._state.value = newState;
        this._primaryRevealers.forEach(revealer => {
            revealer.revealChild = newState.primaryRevealed;
        });
        this.emit('state-changed', newState.primaryRevealed);
    }

    register(revealer, type) {
        if (type === 'primary') this._primaryRevealers.add(revealer);
        else if (type === 'secondary') this._secondaryRevealers.add(revealer);
        return revealer;
    }
}

export const RevealerState = new RevealerService();

export const RevealerButton = () => Widget.Button({
    className: 'txt-larger sec-txt',
    onClicked: () => RevealerState.toggleSecondary(),
    onSecondaryClick: () => RevealerState.togglePrimary(),
    child: Widget.Box({
        children: [
            Widget.Label({
                hpack: "end",
                className: 'icon-material revealer-icon',
                label: 'expand_more',
                setup: (self) => {
                    self.hook(RevealerState.state, state => {
                        if (!state.primaryRevealed) {
                            self.label = 'unfold_less';
                        } else if (state.secondaryRevealed) {
                            self.label = 'expand_less';
                        } else {
                            self.label = 'expand_more';
                        }
                    });
                    return self;
                }
            })
        ]
    })
});

const hyprctl = (cmd) => execAsync(["hyprctl", ...cmd.split(" ")]).catch(print);
const getHyprOption = async (opt) =>
  JSON.parse(await Utils.execAsync(`hyprctl -j getoption ${opt}`));
