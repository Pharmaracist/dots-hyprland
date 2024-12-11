import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Button } = Widget;
const { GLib } = imports.gi;

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
        className: "icon-material sec-txt txt-large",
        label: `${icon}`,
      }),
    );
  }
  return utilButtonCache.get(key);
};
const NerdButton = ({ name, icon, onClicked }) => {
  const key = `${name}-${icon}`;
  if (!utilButtonCache.has(key)) {
    utilButtonCache.set(
      key,
      Button({
        vpack: "center",
        tooltipText: name,
        onClicked: onClicked,
        className: "icon-nerd sec-txt txt-title",
        label: `${icon}`,
      }),
    );
  }
  return utilButtonCache.get(key);
};
const Shortcuts = () => {
  const createBox = () => {
    let unsubscriber = () => {};
    let wallpaperFolder = "";
    let status = true;

    const change_wallpaper_btn = UtilButton({
      name: getString("Change wallpaper"),
      icon: "image",
      onClicked: () => App.toggleWindow("wallselect"),
    });

    const chatBot = UtilButton({
      name: getString("ChatGPT"),
      icon: "smart_toy",
      onClicked: () => Utils.execAsync(`firefox --new-window chatgpt.com`),
    });

    const obsidian = NerdButton({
      name: getString("GitHub"),
      icon: "\uea84",
      onClicked: () =>
        Utils.execAsync(`firefox --new-window github.com/pharmaracist`),
    });

    const desktopClock = NerdButton({
      name: getString("toggle on screen clock"),
      icon: "\udb80\udd09",
      onClicked: () => App.toggleWindow("desktopbackground"),
    });

    const ags_tweaks = UtilButton({
      name: getString("Settings"),
      icon: "water_drop",
      onClicked: () =>
        Utils.execAsync([
          "bash",
          "-c",
          `${GLib.get_home_dir()}/.local/bin/ags-tweaks`,
        ]),
    });

    const box = Box({
      hpack: "center",
      className: "spacing-h-10",
      children: [
        obsidian,
        desktopClock,
        change_wallpaper_btn,
        ags_tweaks,
        chatBot,
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
      ],
    });

    unsubscriber = userOptions.subscribe((userOptions) => {
      wallpaperFolder = userOptions.bar.wallpaper_folder;
      const current_status = typeof wallpaperFolder === "string";
      if (status !== current_status) {
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

  return createBox();
};

export default () => Shortcuts();
