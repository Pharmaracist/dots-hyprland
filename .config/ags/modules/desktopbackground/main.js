import Widget from "resource:///com/github/Aylur/ags/widget.js";

import WallpaperImage from "./wallpaper.js";
import TimeAndLaunchesWidget from "./timeandlaunches.js";
import SystemWidget from "./system.js";
import BigTimeAndLaunchesWidget from "./bigClock.js";
export default (monitor) =>
  Widget.Window({
    name: `desktopbackground`,
    keymode: "on-demand",
    layer: "background",
    exclusivity: "ignore",
    visible: true,
    child: Widget.Overlay({
      child: WallpaperImage(monitor),
      overlays: [
        // TimeAndLaunchesWidget(), 
        BigTimeAndLaunchesWidget(),
        // SystemWidget(),
     
      ],
      setup: (self) => {
        self.set_overlay_pass_through(self.get_children()[1], true);
      },
    }),
  });
