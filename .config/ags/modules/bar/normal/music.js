import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { showMusicControls } from "../../../variables.js";
const { Box, Button, Label, Overlay } = Widget;
const { Pango } = imports.gi;

function trimTrackTitle(title) {
  if (!title) return getString("No title");
  const cleanPatterns = [/【[^】]*】/, " [FREE DOWNLOAD]"];
  return cleanPatterns.reduce(
    (str, pattern) => str.replace(pattern, ""),
    title,
  );
}

const MusicStuff = () => {
  const playingState = Box({
    homogeneous: true,
    children: [
      Overlay({
        child: Box({
          vpack: "center",
          className: "bar-music-playstate",
          homogeneous: true,
          children: [
            Label({
              vpack: "center",
              className: "bar-music-playstate-txt",
              justification: "center",
              setup: (self) =>
                self.hook(Mpris, () => {
                  const mpris = Mpris.getPlayer("");
                  self.label =
                    mpris?.playBackStatus === "Playing"
                      ? "pause"
                      : "play_arrow";
                }),
            }),
          ],
          setup: (self) =>
            self.hook(Mpris, () => {
              const mpris = Mpris.getPlayer("");
              if (!mpris) return;
              self.toggleClassName(
                "bar-music-playstate-playing",
                mpris.playBackStatus === "Playing",
              );
              self.toggleClassName("bar-music-playstate", true);
            }),
        }),
      }),
    ],
  });

  const trackTitle = Label({
    hexpand: false,
    className: "txt-smallie bar-music-txt",
    wrap: true, // Enable text wrapping
    ellipsize: Pango.EllipsizeMode.END, // Truncate with ellipsis
    maxWidthChars: 40, // Maximum width in characters (adjust as needed)
    truncate: "end",
    setup: (self) => {
      const update = () => {
        const mpris = Mpris.getPlayer("");
        if (mpris) {
          self.label = `${trimTrackTitle(mpris.trackTitle)} `; //• ${mpris.trackArtists.join(", ")}`;
        } else {
          self.label = getString("");
        }
      };
      self.hook(Mpris, update, "player-changed");
      self.hook(Mpris, update, "changed");
    },
  });

  // Wrap everything in a Box and set visibility based on media availability
  const musicBox = Box({
    className: "spacing-h-10",
    hexpand: false,
    children: [trackTitle],
    setup: (self) => {
      const updateVisibility = () => {
        const mpris = Mpris.getPlayer("");
        self.visible = !!mpris; // Set visibility to true if there's a media player
      };
      self.hook(Mpris, updateVisibility, "player-changed");
      self.hook(Mpris, updateVisibility, "changed");

      // Initial visibility check
      updateVisibility();
    },
  });

  return musicBox;
};

export default () =>
  Widget.EventBox({
    onPrimaryClick: () => showMusicControls.setValue(!showMusicControls.value),
    onSecondaryClick: () => {
      App.toggleWindow("wallselect"), closeEverything();
    },
    onMiddleClick: () => {
      Utils.execAsync(`pywal-spicetify pywal-spicetify`);
    },
    child: Widget.Box({
      children: [MusicStuff()],
    }),
  });
