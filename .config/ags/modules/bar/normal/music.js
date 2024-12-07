const { GLib } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
const { Box, Button, Label, Overlay } = Widget;
const { execAsync } = Utils;
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";

function trimTrackTitle(title) {
  if (!title) return getString("No title");
  const cleanPatterns = [/【[^】]*】/, " [FREE DOWNLOAD]"];
  return cleanPatterns.reduce(
    (str, pattern) => str.replace(pattern, ""),
    title,
  );
}

const TrackProgress = () => {
  const _updateProgress = (circprog) => {
    const mpris = Mpris.getPlayer("");
    if (!mpris) return;
    circprog.css = `font-size: ${Math.max((mpris.position / mpris.length) * 100, 0)}px;`;
  };
  return AnimatedCircProg({
    className: "bar-music-circprog",
    vpack: "center",
    hpack: "center",
    setup: (self) => {
      self.hook(Mpris, () => _updateProgress(self), "player-changed");
      self.hook(Mpris, () => _updateProgress(self), "position");
      self.poll(3000, () => _updateProgress(self));
    },
  });
};

// const playingState = Box({
//   homogeneous: true,
//   children: [
//     Overlay({
//       child: Box({
//         vpack: "center",
//         className: "bar-music-playstate",
//         homogeneous: true,
//         children: [
//           Label({
//             vpack: "center",
//             className: "bar-music-playstate-txt",
//             justification: "center",
//             setup: (self) =>
//               self.hook(Mpris, () => {
//                 const mpris = Mpris.getPlayer("");
//                 self.label =
//                   mpris?.playBackStatus === "Playing"
//                     ? "pause"
//                     : "play_arrow";
//               }),
//           }),
//         ],
//         setup: (self) =>
//           self.hook(Mpris, () => {
//             const mpris = Mpris.getPlayer("");
//             if (!mpris) return;
//             self.toggleClassName(
//               "bar-music-playstate-playing",
//               mpris.playBackStatus === "Playing",
//             );
//             self.toggleClassName("bar-music-playstate", true);
//           }),
//       }),
//       overlays: [TrackProgress()],
//     }),
//   ],
// });

const trackTitle = Label({
  hexpand: true,
  className: "txt-smallie bar-music-txt",
  truncate: "end",
  maxWidthChars: 40,
  setup: (self) => {
    const update = () => {
      const mpris = Mpris.getPlayer("");
      if (mpris) {
        self.label = `${trimTrackTitle(mpris.trackTitle)} • ${mpris.trackArtists.join(", ")}`;
      } else {
        self.label = getString("No media");
      }
    };
    self.hook(Mpris, update, "player-changed");
    self.hook(Mpris, update, "changed");
  },
});

const musicStuff = Box({
  css :"min-width:20px;",
  className: "spacing-h-10",
  hexpand: true,
  children: [trackTitle],
});

export default () => {
  return Box({
    className: "spacing-h-4",
    children: [musicStuff],
  });
};
