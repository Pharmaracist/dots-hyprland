import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Button } = Widget;
const { GLib } = imports.gi;

const createUtilButton = ({ name, icon, onClicked }) =>
  Button({
    vpack: "center",
    tooltipText: name,
    onClicked,
    className: "icon-material sec-txt txt-large",
    label: icon, // No need for template literal here
  });

const createNerdButton = ({ name, icon, onClicked }) =>
  Button({
    vpack: "center",
    tooltipText: name,
    onClicked,
    className: "icon-nerd sec-txt txt-title",
    label: icon, // No need for template literal here
  });



const Shortcuts = () => {
  let unsubscriber = () => {};
  let wallpaperFolder = "";
  let showWallpaperButton = false;

  const changeWallpaperButton = createUtilButton({
    name: getString("Change wallpaper"),
    icon: "image",
    onClicked: () => App.toggleWindow("wallselect"),
  });

  const chatGPTButton = createUtilButton({
    name: getString("ChatGPT"),
    icon: "smart_toy",
    onClicked: () => Utils.execAsync(`firefox --new-window chatgpt.com`),
  });

  const gitHubButton = createNerdButton({
    name: getString("GitHub"),
    icon: "\uea84",
    onClicked: () => Utils.execAsync(`firefox --new-window github.com/pharmaracist`),
  });

  const desktopClockButton = createNerdButton({
    name: getString("toggle on screen clock"),
    icon: "\udb80\udd09",
    onClicked: () => App.toggleWindow("desktopbackground"),
  });

  const agsTweaksButton = createUtilButton({
    name: getString("Settings"),
    icon: "water_drop",
    onClicked: () => Utils.execAsync([
      "bash",
      "-c",
      `${GLib.get_home_dir()}/.local/bin/ags-tweaks`,
    ]),
  });

  const screenSnipButton = createUtilButton({
    name: getString("Screen snip"),
    icon: "screenshot_region",
    onClicked: () => Utils.execAsync(`${App.configDir}/scripts/grimblast.sh copy area`).catch(print),
  });

  const colorPickerButton = createUtilButton({
    name: getString("Color picker"),
    icon: "colorize",
    onClicked: () => Utils.execAsync(["hyprpicker", "-a"]).catch(print),
  });

  const box = Box({
    hpack: "center",
    className: "spacing-h-10",
    children: [
      gitHubButton,
      desktopClockButton,
      agsTweaksButton,
      chatGPTButton,
      screenSnipButton,
      colorPickerButton,
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

export default Shortcuts; // Directly export the function
