import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import App from "resource:///com/github/Aylur/ags/app.js";
const { Box, Button } = Widget;
const { GLib } = imports.gi;

const createUtilButton = ({ name, icon, onClicked, onSecondaryClick }) => {
  const buttonProps = {
    vpack: "center",
    tooltipText: name,
    onClicked,
    className: "icon-material sec-txt txt-larger",
    label: icon, // No need for template literal here
  };
  
  if (onSecondaryClick) {
    buttonProps.onSecondaryClick = onSecondaryClick;
  }
  
  return Button(buttonProps);
};

const createNerdButton = ({ name, icon, onClicked, onSecondaryClick }) => {
  const buttonProps = {
    vpack: "center",
    tooltipText: name,
    onClicked,
    className: "icon-nerd sec-txt txt-title",
    label: icon, // No need for template literal here
  };
  
  if (onSecondaryClick) {
    buttonProps.onSecondaryClick = onSecondaryClick;
  }
  
  return Button(buttonProps);
};



const Shortcuts = () => {
  let unsubscriber = () => {};
  let wallpaperFolder = "";
  let showWallpaperButton = false;

  const changeWallpaperButton = createUtilButton({
    name: "Change wallpaper",
    icon: "image",
    onClicked: () => Utils.execAsync([
      `${App.configDir}/scripts/color_generation/randomwall.sh`
    ]),
    onSecondaryClick: () => App.toggleWindow("wallselect"),
  });

  const unixporn = createUtilButton({
    name: "Unix Porn",
    css:"font-size:1.8rem",
    icon: "\udb81\udfea",
    onClicked: () => Utils.execAsync(`xdg-open "https://www.reddit.com/r/unixporn/"`),
  });

  const chatGPTButton = createUtilButton({
    name: "ChatGPT",
    icon: "smart_toy",
    onClicked: () => Utils.execAsync(`firefox --new-window chatgpt.com`),
  });

  const gitHubButton = createNerdButton({
    name: "GitHub",
    icon: "\uea84",
    onClicked: () => Utils.execAsync(`firefox --new-window github.com/pharmaracist`),
  });

  const yt = createNerdButton({
    name: "YT",
    icon: "\uf166",
    onClicked: () => Utils.execAsync(`firefox --new-window youtube.com`),
  });

  const agsTweaksButton = createUtilButton({
    name: "Settings",
    icon: "water_drop",
    onClicked: () => Utils.execAsync([
      "bash",
      "-c",
      `${GLib.get_home_dir()}/.local/bin/ags-tweaks`,
    ]),
  });

  const screenSnipButton = createUtilButton({
    name: "Screen snip",
    icon: "screenshot_region",
    onClicked: () => Utils.execAsync(`${App.configDir}/scripts/grimblast.sh copy area`).catch(print),
  });

  const colorPickerButton = createUtilButton({
    name: "Color picker",
    icon: "colorize",
    onClicked: () => Utils.execAsync(["hyprpicker", "-a"]).catch(print),
  });

  const box = Box({
    hpack: "center",
    className: "spacing-h-10",
    children: [
      yt,
      agsTweaksButton,
      gitHubButton,
      unixporn,
      // chatGPTButton,
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
