import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import cava from "../../services/cava.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { AnimatedCircProg } from "../.commonwidgets/cairo_circularprogress.js";
import Indicator from "../../services/indicator.js";
import GLib from "gi://GLib";

const COVER_FALLBACK = "media-optical-symbolic";
const getPlayer = () =>
  Mpris.players.find((p) => p.trackTitle) || Mpris.getPlayer("");

let showBackground = true;
let mainWidget = null;

const toggleBackground = () => {
  showBackground = !showBackground;
  if (mainWidget) {
    const player = getPlayer();
    mainWidget.className = `ipod-widget ${
      showBackground ? "" : "blur-container"
    }`;
    mainWidget.css = `
            min-height: 260px;
            background: ${
              showBackground && player?.cover_path
                ? `
                linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), 
                url('${player.cover_path}')
            `
                : "rgba(0, 0, 0, 0.25)"
            };
            ${
              showBackground && player?.cover_path
                ? `
                background-size: cover;
                background-position: center;
            `
                : ""
            }
            border-radius: 24px;
        `;
  }
};

const handleScroll = (direction) => {
  if (!Audio.speaker) return;
  const step = Audio.speaker.volume <= 0.15 ? 0.01 : 0.05;
  Audio.speaker.volume += direction * step;
  Indicator.popup(1);
};

const BluetoothIndicator = () =>
  Widget.Box({
    className: "bluetooth-indicator spacing-h-5",
    setup: (self) =>
      self.hook(Bluetooth, () => {
        const audioDevices = Bluetooth.connected_devices.filter(
          (device) =>
            device.iconName?.includes("audio") ||
            device.iconName?.includes("headphone") ||
            device.iconName?.includes("headset")
        );
        self.children = audioDevices.map((device) =>
          Widget.Box({
            className: "onSurfaceVariant txt-norm spacing-h-5",
            vpack: "center",
            tooltipText: device.name,
            children: [
              Widget.Icon({
                className: "onSurfaceVariant",
                icon: `${device.iconName}-symbolic`,
                size: 24,
              }),
              ...(device.batteryPercentage
                ? [
                    Widget.Label({
                      className: "txt-norm onSurfaceVariant",
                      label: `${device.batteryPercentage}%`,
                    }),
                  ]
                : []),
            ],
          })
        );
        self.visible = audioDevices.length > 0;
      }),
  });

const VolumeIndicator = () => {
  const icon = Widget.Icon({
    className: "app-icon",
    size: 24,
    setup: (self) =>
      self.hook(Mpris, () => {
        const player = getPlayer();
        self.visible = !!player;
        self.icon_name = player?.busName?.includes("spotify")
          ? "spotify-client"
          : player?.busName?.includes("mpv")
          ? "mpv"
          : player?.busName?.includes("chromium")
          ? "youtube-music"
          : player?.busName?.includes("amberol")
          ? "io.bassi.Amberol"
          : COVER_FALLBACK;
      }),
  });

  const circprog = AnimatedCircProg({
    className: "volume-circprog",
    vpack: "center",
    hpack: "center",
  });

  return Widget.EventBox({
    onScrollUp: () => handleScroll(1),
    onScrollDown: () => handleScroll(-1),
    child: Widget.Box({
      className: "spacing-h-4 txt-small onSurfaceVariant",
      children: [
        Widget.Box({
          homogeneous: true,
          children: [
            Widget.Box({
              className: "volume-icon",
              homogeneous: true,
              child: Widget.Overlay({
                child: icon,
                overlays: [circprog],
              }),
              setup: (self) =>
                self.hook(Audio, () => {
                  const vol = Math.round(Audio.speaker?.volume * 100);
                  circprog.css = `font-size: ${vol}px;`;
                }),
            }),
          ],
        }),
        Widget.Label({
          className: "txt-norm",
          setup: (self) =>
            self.hook(
              Audio,
              () => (self.label = `${Math.round(Audio.speaker?.volume * 100)}%`)
            ),
        }),
        BluetoothIndicator(),
      ],
    }),
  });
};

const MediaControls = () => {
  const progressCircle = AnimatedCircProg({
    className: "volume-circprog",
    vpack: "center",
    hpack: "center",
    css: "font-size: 0px;",
  });

  const playButton = Widget.Button({
    className: "control-button onSurfaceVariant",
    child: Widget.Box({
      className: "volume-icon",
      homogeneous: true,
      child: Widget.Overlay({
        child: Widget.Label({ label: "play_arrow" }),
        overlays: [progressCircle],
      }),
    }),
    onClicked: () => {
      const player = getPlayer();
      if (!player) return;
      player.playPause();
    },
  });

  const updateProgress = () => {
    const player = getPlayer();
    if (!player) {
      progressCircle.css = "font-size: 0px;";
      return;
    }

    try {
      const length = player.metadata["mpris:length"] || 0;
      const position = Math.floor(player.position * 1000000);

      if (length > 0) {
        const progress = Math.max(
          0,
          Math.min(100, Math.floor((position / length) * 100))
        );
        progressCircle.css = `font-size: ${progress}px;`;
        playButton.child.child.child.label =
          player?.playBackStatus === "Playing" ? "pause" : "play_arrow";
      } else {
        progressCircle.css = "font-size: 0px;";
      }
    } catch (e) {
      console.error(e);
      progressCircle.css = "font-size: 0px;";
    }
  };

  // Initial update
  Utils.timeout(100, updateProgress);

  // Regular updates
  Utils.interval(1000, () => {
    if (progressCircle.is_destroyed) return false;
    if (getPlayer()?.playBackStatus === "Playing") updateProgress();
    return true;
  });

  const wallpaperButton = Widget.Button({
    className: "control-button onSurfaceVariant",
    child: Widget.Label({
      label: showBackground ? "visibility" : "visibility_off",
    }),
    onClicked: () => {
      toggleBackground();
      wallpaperButton.child.label = showBackground
        ? "visibility"
        : "visibility_off";
    },
  });

  return Widget.Box({
    className: "control-buttons",
    children: [
      Widget.Button({
        className: "control-button onSurfaceVariant",
        child: Widget.Label({ label: "skip_previous" }),
        onClicked: () => getPlayer()?.previous(),
      }),
      playButton,
      Widget.Button({
        className: "control-button onSurfaceVariant",
        child: Widget.Label({ label: "skip_next" }),
        onClicked: () => getPlayer()?.next(),
      }),
      wallpaperButton,
    ],
  });
};

const TrackLabels = () =>
  Widget.Box({
    vertical: true,
    vpack: "center",
    hexpand: true,
    children: ["title", "artist"].map((type) =>
      Widget.Label({
        className: `track-${type}`,
        xalign: 0,
        truncate: "end",
        maxWidthChars: 100,
        setup: (self) =>
          self.hook(Mpris, () => {
            const player = getPlayer();
            self.label =
              type === "title"
                ? player?.track_title || "Not Playing"
                : player?.track_artists.join(", ") || "No Artist";
          }),
      })
    ),
  });

const CavaVisualizer = () => {
  const bars = Array(73)
    .fill(0)
    .map(() =>
      Widget.Label({
        label: "▁",
        className: "cava-bar",
        hpack: "center",
        hexpand: true,
      })
    );

  return Widget.Box({
    className: "cava-visualizer",
    spacing: 2,
    hpack: "center",
    vpack: "end",
    hexpand: true,
    children: bars,
    setup: (self) =>
      self.hook(
        cava,
        () => {
          if (self.is_destroyed) return;
          const chars = cava.output?.split("") || [];
          bars.forEach((bar, i) => {
            if (bar.is_destroyed) return;
            if (i < chars.length) {
              const height = chars[i].charCodeAt(0) - 9601;
              bar.className = `cava-bar${
                height > 4.9
                  ? " cava-bar-high"
                  : height > 2.8
                  ? " cava-bar-med"
                  : " cava-bar-low"
              }`;
              bar.label = chars[i];
            } else {
              bar.label = "▁";
              bar.className = "cava-bar";
            }
          });
        },
        "output-changed"
      ),
  });
};

let lastScrollTime = 0;
const SCROLL_DELAY = 900; // 900ms delay between scroll actions

const CoverArt = () => {
  const box = Widget.EventBox({
    onScrollUp: (self, event) => {
      const currentTime = GLib.get_monotonic_time() / 1000;
      if (currentTime - lastScrollTime < SCROLL_DELAY) return true;

      const player = getPlayer();
      if (player) player.next();
      lastScrollTime = currentTime;
      return true; // Stop event propagation
    },
    onScrollDown: (self, event) => {
      const currentTime = GLib.get_monotonic_time() / 1000;
      if (currentTime - lastScrollTime < SCROLL_DELAY) return true;

      const player = getPlayer();
      if (player) player.previous();
      lastScrollTime = currentTime;
      return true; // Stop event propagation
    },
    child: Widget.Box({
      className: "cover-art",
      css: `
                min-width: 160px;
                min-height: 160px;
                background-image: url('${COVER_FALLBACK}');
                background-size: cover;
                background-position: center;
                border-radius: 18px;
                padding: 0 1.6rem;
                margin: 1rem 3rem 1rem 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `,
    }),
  });

  box.child.hook(Mpris, (self) => {
    const player = getPlayer();
    const coverPath = player?.cover_path;

    // Show thumbnail if we have a player and cover
    self.visible = !!(player && coverPath);

    if (coverPath) {
      self.css = `
                min-width: 160px;
                min-height: 160px;
                background-image: url('${coverPath}');
                background-size: cover;
                background-position: center;
                border-radius: 18px;
                padding: 0 1.6rem;
                margin: 1rem 3rem 1rem 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;
    } else {
      self.css = `
                min-width: 160px;
                min-height: 160px;
                background-image: url('${COVER_FALLBACK}');
                background-size: cover;
                background-position: center;
                border-radius: 18px;
                padding: 0 1.6rem;
                margin: 1rem 3rem 1rem 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            `;
    }
  });

  return box;
};

const formatTime = (seconds) => {
  if (seconds <= 0) return "0:00";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return hours > 0
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`
    : `${minutes}:${secs.toString().padStart(2, "0")}`;
};

export default () => {
  const widget = Widget.Box({
    className: "ipod-widget",
    css: "min-height: 260px;",
    setup: (self) => {
      mainWidget = self;
      self.hook(Mpris, () => {
        const player = getPlayer();
        self.className = `ipod-widget ${
          showBackground ? "" : "blur-container"
        }`;
        self.css = `
                    min-height: 260px;
                    background: ${
                      showBackground && player?.cover_path
                        ? `
                        linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), 
                        url('${player.cover_path}')
                    `
                        : "rgba(0, 0, 0, 0.25)"
                    };
                    ${
                      showBackground && player?.cover_path
                        ? `
                        background-size: cover;
                        background-position: center;
                    `
                        : ""
                    }
                    border-radius: 24px;
                `;
      });
    },
    children: [
      Widget.Box({
        className: "ipod-content",
        children: [
          Widget.Overlay({
            child: Widget.Box({
              className: "cava-container",
              children: [CavaVisualizer()],
            }),
            overlays: [
              Widget.Box({
                children: [
                  Widget.Box({
                    // className: "left-section",
                    children: [CoverArt()],
                  }),
                  Widget.Box({
                    className: "spacing-v-10",
                    vpack: "center",
                    vertical: true,
                    vexpand: true,
                    children: [
                      TrackLabels(),
                      LyricsDisplay(),
                      Widget.Box({
                        vpack: "end",
                        vexpand: true,
                        children: [MediaControls()],
                      }),
                    ],
                  }),
                  Widget.Box({
                    vpack: "start",
                    className: "app-icon-volume-container",
                    children: [VolumeIndicator()],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
  return widget;
};
