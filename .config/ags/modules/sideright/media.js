import Widget from "resource:///com/github/Aylur/ags/widget.js";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import { TabContainer } from "../.commonwidgets/tabcontainer.js";

// Audio files tab component
const AudioFiles = ({ directory = GLib.get_home_dir() + "/Music" } = {}) => {
  const fileList = Widget.Box({
    vertical: true,
    className: "audio-files-list",
  });

  const updateFileList = () => {
    const dir = Gio.File.new_for_path(directory);
    fileList.children = [];

    try {
      const enumerator = dir.enumerate_children(
        "standard::*",
        Gio.FileQueryInfoFlags.NONE,
        null,
      );
      let fileInfo;

      while ((fileInfo = enumerator.next_file(null)) !== null) {
        const filename = fileInfo.get_name();
        if (!filename.match(/\.(mp3|wav|ogg|m4a|flac|opus)$/i)) continue;

        const button = Widget.Button({
          child: Widget.Box({
            children: [
              Widget.Icon({
                icon: "audio-x-generic-symbolic",
                size: 24,
                className: "audio-files-icon",
              }),
              Widget.Label({
                label: filename,
                xalign: 0,
                maxWidthChars: 30,
                truncate: "end",
                // wrap: true,
                justification: "left",
                className: "audio-files-label",
              }),
            ],
            homogeneous: false,
            spacing: 8,
          }),
          className: "audio-files-button",
          onClicked: () => {
            const filepath = GLib.build_filenamev([directory, filename]);
            const proc = Gio.Subprocess.new(
              ["xdg-open", filepath],
              Gio.SubprocessFlags.NONE,
            );
            proc.wait_async(null, () => {});
          },
        });

        fileList.add(button);
      }
    } catch (error) {
      console.error("Error reading directory:", error);
    }
  };

  const widget = Widget.Box({
    vertical: true,
    className: "audio-files-widget",
    setup: (self) => {
      // Cleanup handler
      self.connect('destroy', () => {
        self.get_children().forEach(child => {
          if (child.destroy) child.destroy();
        });
      });

      // File monitor setup
      const file = Gio.File.new_for_path(directory);
      const monitor = file.monitor_directory(
        Gio.FileMonitorFlags.NONE,
        null
      );

      const monitorHandler = monitor.connect('changed', () => {
        updateFileList();
      });

      self.connect('destroy', () => {
        monitor.disconnect(monitorHandler);
        monitor.cancel();
      });
    },
    children: [
      Widget.Scrollable({
        child: fileList,
        vexpand: true,
        hscroll: "never",
        className: "audio-files-scrollable",
      }),
    ],
  });

  updateFileList();
  return widget;
};

// Export the media tabs widget using the common TabContainer
export default () => AudioFiles();
