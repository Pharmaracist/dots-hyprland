import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { showMusicControls } from "../../../variables.js";

const { Box, Label, EventBox } = Widget;

// Music Widget
export default () =>
  EventBox({
    onPrimaryClick: () => {
      showMusicControls.setValue(!showMusicControls.value);
    },
    child: Box({
      children: [
        Label({
          className: "bar-music-txt",
          truncate: "end",
          maxWidthChars: 30,
          setup: (self) => {
            const update = () => {
              const mpris = Mpris.getPlayer(""); // Get active player
              if (mpris && mpris.trackTitle) {
                self.label = `${mpris.trackTitle}`;
              } else {
                self.label = ""; // Fallback text
              }
            };
            self.hook(Mpris, update, "player-changed");
            self.hook(Mpris, update, "changed");

            update();
          },
        }),
      ],
    }),
  });
