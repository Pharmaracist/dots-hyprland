import Widget from "resource:///com/github/Aylur/ags/widget.js";
import GLib from "gi://GLib";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";

const MAX_TITLE_LENGTH = 25;

const MidTitle = async () => {
  const commonLabelProps = {
    xalign: 0,
    truncate: "end",
  };

  const midLabel = Widget.Label({
    ...commonLabelProps,
    className: "txt-small txt-onLayer1",
    // css: "margin:5px 0px 0px -15px;",
    setup: (self) =>
      self.hook(Hyprland.active.client, () => {
        let title =
          Hyprland.active.client.title ||
          `Workspace ${Hyprland.active.workspace.id}`;
        self.label =
          title.length > MAX_TITLE_LENGTH
            ? `${title.slice(0, MAX_TITLE_LENGTH)}...`
            : title;
      }),
  });

  return Widget.Box({
    children: [midLabel],
  });
};

export default async () => {
  const midTitleInstance = await MidTitle();

  return midTitleInstance;
};
