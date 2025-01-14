const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import SpaceLeft from "../modules/spaceleft.js";
import battery from "../modules/battery.js";
import BarResources from "../modules/resourcesbar.js";
import Media from "../modules/music.js";
import simpleClock from "../modules/simple_clock.js";
import { StatusIcons } from "../../.commonwidgets/statusicons.js";
import NormalOptionalWorkspaces from "./../normal/workspaces_hyprland.js";
import kb_layout from "../modules/kb_layout.js";
import Fetcher from "../modules/fetcher.js";
import IconWidget from "../modules/icon.js";
import { Tray } from "../normal/tray.js";
import ColorPicker from "../modules/color_picker.js";
import scrolledmodule from "../../.commonwidgets/scrolledmodule.js";
import PinnedApps from "../modules/pinned_apps.js";
export const AnoonBar = Widget.CenterBox({
    css:`margin: 0.5rem 1.5rem;`,
    startWidget: Widget.Box({
      vpack: "center",
      vexpand: true,
      spacing: 10,
      children:[ 
        IconWidget({icon:'nixos-symbolic.svg',size:32,className:'sec-txt'}),
        // Widget.Box({ child:avatar(), }),
        await SpaceLeft(),
      ]
      }),
    centerWidget: Widget.Box({
      spacing: 5,
      children: [
        Widget.Box({
          css:`min-width:30rem`,
          child:scrolledmodule({
            children: [
              Widget.Box({className:"bar-knocks",child:Media()}),
              Widget.Box({className:"bar-knocks",hexpand:true,hpack:"end",child:ColorPicker()}),
              Widget.Box({className:"bar-knocks",hexpand:true,hpack:"end",child:PinnedApps()}),
            ]
          })
        }),
        Widget.Box({
          className: "bar-knocks",
          children: [NormalOptionalWorkspaces()],
        }),
        scrolledmodule({
          children: [
            Widget.Box({
              children: [
                Widget.Box({
                  css:`min-width:30rem`,
                  className: "bar-knocks",
                  children: [simpleClock(),StatusIcons(),kb_layout(),BarResources(),battery()],
                }),
              ],
            }),
            Widget.Box({ className: "bar-knocks", children: [Fetcher()] }),
          ],
        }),
      
      ],
    }),
    endWidget:Widget.Box({spacing:10,children:[ Widget.Box({hexpand:true}),Tray(),IconWidget({icon:'nixos-symbolic.svg',size:32,className:'sec-txt'})]}),
  });