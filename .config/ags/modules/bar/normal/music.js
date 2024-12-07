import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";

const { Box, Label } = Widget;

// Helper function to trim and sanitize track titles
function trimTrackTitle(title) {
  if (!title) return "No title"; // Fallback if title is missing
  const cleanPatterns = [/【[^】]*】/, " [FREE DOWNLOAD]"];
  return cleanPatterns.reduce(
    (str, pattern) => str.replace(pattern, ""),
    title
  );
}

// Music Widget
export default () => Box({
  // className: "bar-music-box",
  children: [
    Label({
      className: "bar-music-txt",
      truncate: "end",
      maxWidthChars: 100,
      setup: (self) => {
        const update = () => {
          const mpris = Mpris.getPlayer(""); // Get active player
          if (mpris && mpris.trackTitle) {
            self.label = `${trimTrackTitle(mpris.trackTitle)}`;
          } else {
            self.label = "     "; // Fallback text
          }
        };

        // Hook MPRIS signals for dynamic updates
        self.hook(Mpris, update, "player-changed");
        self.hook(Mpris, update, "changed");

        // Initial update
        update();
      },
    }),
  ],
});
