import App from "resource:///com/github/Aylur/ags/app.js";
import Audio from "resource:///com/github/Aylur/ags/service/audio.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Bluetooth from "resource:///com/github/Aylur/ags/service/bluetooth.js";
import Network from "resource:///com/github/Aylur/ags/service/network.js";
import Notifications from "resource:///com/github/Aylur/ags/service/notifications.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
// import { languages } from "./statusicons_languages.js";
const { GLib } = imports.gi;
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";

export const MicIndicator = () =>
  Widget.Button({
    onClicked: () => {
      if (Audio.microphone)
        Audio.microphone.isMuted = !Audio.microphone.isMuted;
    },
    child: Widget.Box({
      children: [
        Widget.Stack({
          transition: "slide_up_down",
          transitionDuration: userOptions.asyncGet().animations.durationSmall,
          children: {
            true: MaterialIcon("mic_off", "norm"),
            false: MaterialIcon("mic", "norm"),
          },
          setup: (self) =>
            self.hook(Audio, (stack) => {
              if (!Audio.microphone) return;
              stack.shown = String(Audio.microphone.isMuted);
            }),
        }),
      ],
    }),
  });

export const SpeakerIndicator = () =>
  Widget.Button({
    onClicked: () => {
      if (Audio.speaker) Audio.speaker.isMuted = !Audio.speaker.isMuted;
    },
    child: Widget.Box({
      children: [
        Widget.Stack({
          transition: "slide_up_down",
          transitionDuration: userOptions.asyncGet().animations.durationSmall,
          children: {
            true: MaterialIcon("volume_off", "norm"),
            false: MaterialIcon("volume_up", "norm"),
          },
          setup: (self) =>
            self.hook(Audio, (stack) => {
              if (!Audio.speaker) return;
              stack.shown = String(Audio.speaker.isMuted);
            }),
        }),
      ],
    }),
  });

export const BarToggles = (props = {}, monitor = 0) =>
  Widget.Box({
    ...props,
    child: Widget.Box({
      className: "bar-button",
      children: [
        Widget.Box({
          className: "spacing-h-10 prim-txt ",
          children: [
            // optionalKeyboardLayoutInstances[monitor],
            MicIndicator(),
            SpeakerIndicator(),
          ],
        }),
      ],
    }),
  });
