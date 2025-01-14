import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { showMusicControls } from "../../../variables.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { RevealerState } from "./revealercontrol.js";
import App from "resource:///com/github/Aylur/ags/app.js";

export const BarButton = () => {
  const button = Widget.EventBox({
    className: "txt-gigantic icon-nerd sec-txt",
    child: Widget.Label({
      label: " \ue732 ",
    }),
    onPrimaryClick: () => {
      RevealerState.toggleAll();
    },
    onSecondaryClick: () => {
      App.toggleWindow("session");
    },
  });

  // Update button state when revealers change
  button.hook(RevealerState, () => {
    button.child.label = RevealerState.isRevealed ? " \ue731 " : " \ue732 ";
  }, 'changed');

  return button;
};
