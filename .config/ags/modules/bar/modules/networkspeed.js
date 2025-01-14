const { GLib } = imports.gi;
import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
//import { exec_sh_sync } from "resource:///com/github/Aylur/ags/service/exec.js"; // Assuming exec.sh sync is available for executing commands
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";

const { exec, execAsync } = Utils;

let lastDownload = 0;
let lastUpload = 0;
let lastTimestamp = GLib.get_real_time();

const networkSpeedIndicator = () =>
  Widget.Stack({
    transition: "slide_up_down",
    transitionDuration: userOptions.asyncGet().animations.durationSmall,
    children: {
      icon: Widget.Icon({
        className: "txt-norm sec-txt icon-material",
        iconName: "network_wifi_1_bar", // Use `iconName` instead of `label`
      }),
      stats: Widget.Box({
        className: "txt-small sec-txt",
        visible: false,
        children: [
          Widget.Label({
            className: "txt-small",
            label: "Download: 0 KB/s",
            attribute: {
              update: (self) =>
                (self.label = `Download: ${self.attribute.downloadSpeed}`),
            },
          }),
          Widget.Label({
            className: "txt-small",
            label: "Upload: 0 KB/s",
            attribute: {
              update: (self) =>
                (self.label = `Upload: ${self.attribute.uploadSpeed}`),
            },
          }),
        ],
      }),
    },
    setup: (self) => {
      self.hook(Network, (stack) => {
        // Use a shell command to get network stats via `ifstat` or `nload` or similar
        const stats = Utils.execAsync("ifstat -i eth0 1 1"); // Example, replace with your network interface

        if (!stats) {
          log("No network stats available");
          return;
        }

        const currentTimestamp = GLib.get_real_time();
        const elapsed = (currentTimestamp - lastTimestamp) / 1000000; // Convert to seconds

        if (elapsed <= 0) {
          log("Elapsed time is too small:", elapsed);
          return;
        }

        // Process the stats output and calculate speeds
        const lines = stats.split("\n");
        const speeds = lines[2].split(/\s+/); // Assuming output is in "KB/s" format

        const downloadSpeed = parseFloat(speeds[1]); // Assuming download speed is at index 1
        const uploadSpeed = parseFloat(speeds[2]); // Assuming upload speed is at index 2

        // Log speed calculation for debugging
        log("Download Speed:", downloadSpeed, "Upload Speed:", uploadSpeed);

        // Update stats
        self.children.stats.children[0].attribute.downloadSpeed = `${Math.round(downloadSpeed)} KB/s`;
        self.children.stats.children[1].attribute.uploadSpeed = `${Math.round(uploadSpeed)} KB/s`;

        // Update last values
        lastDownload = downloadSpeed;
        lastUpload = uploadSpeed;
        lastTimestamp = currentTimestamp;
      });

      // Handle click/reveal action
      self.on_click = () => {
        self.children.stats.visible = !self.children.stats.visible;
      };
    },
  });

export default (props = {}, monitor = 0) =>
  networkSpeedIndicator(props, monitor);
