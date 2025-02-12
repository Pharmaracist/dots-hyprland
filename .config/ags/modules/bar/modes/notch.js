const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Indicators from "../modules/spaceright.js";
import ScrolledModule from "../../.commonwidgets/scrolledmodule.js";
import Clock from "../modules/inline_clock.js";
import BatteryScaleModule from "../modules/battery_scale.js";
import NormalOptionalWorkspaces  from "../normal/workspaces_hyprland.js";
import powermode from "../modules/powermode.js";
import avatar from "../modules/avatar.js";
import Complex from "../modules/weather.js";
import Battery from "../modules/battery.js";
import FocusOptionalWorkspaces  from "../focus/workspaces_hyprland.js";
import { RoundedCorner} from '../../.commonwidgets/cairo_roundedcorner.js';
import { changeWallpaperButton } from "../modules/utils.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
const powerbtn = Widget.Button({
  vpack:'center',
  child: Widget.Label({
    label: "power_settings_new",
    css:`padding:6px ;margin: 5px;`,
    className: "txt-large bar-util-btn2 icon-material onSurfaceVariant",
  }),
  onClicked: () => {
    Utils.timeout(1, () => openWindowOnAllMonitors('session'));
  }
});
const chatGPT = Widget.Button({
  vpack:'center',
  hpack:'center',
  css:`padding:3px ;margin: 5px;`,
  className: "txt-large bar-util-btn2 icon-material onSurfaceVariant",
  child: Widget.Icon({
    icon: "openai-symbolic",
    size: 18,
  }),
  onClicked: () => {
    Utils.execAsync([`xdg-open`,`https://chat.openai.com/`]).catch(print);  
  },
  setup:setupCursorHover
});

const topLeftCorner = RoundedCorner('topleft', {
  className: 'corner'
})
const topRightCorner = RoundedCorner('topright', {
  className: 'corner'
})
export const NotchBar = Widget.CenterBox({
  startWidget: 
  Widget.Box({
    vpack:'center',
    css: "margin-left:2rem;",
    spacing: 10,
    children: [
      Battery(),
      Widget.Box({child:FocusOptionalWorkspaces(),css:`padding:6px 20px`,className: "bar-util-btn2 ",vpack:'center',}),
    ],
  }),
  centerWidget: 
  Widget.Box({
    children: [
      Widget.Box({child:chatGPT,hpack:'center',vpack:'center',className: "bar-util-btn2 ",}),
      Widget.Box({
        children:[
          topRightCorner,
          Widget.Box({
            className: "bar-notch",
            css:`min-height: 3.364rem;margin-bottom:0.5rem`,
            hpack:"center",
            children: [
              Complex(),
            ],
          }),
          topLeftCorner,
        ]
      }),
      Widget.Box({child:changeWallpaperButton(),css:`padding:6px 8px`,className: "bar-util-btn2 ",hpack:'center',vpack:'center',}),
    ]
  }),
  endWidget:
  Widget.Box({
    hpack:"end",
    spacing: 10,
    css:`margin-right:1.4rem`,
    children:[
      Widget.Box({child:Clock(),css:`padding:6px 15px`,className: "bar-util-btn2 ",vpack:'center',}),
      Widget.Box({child:Indicators(),css:`padding:6px 15px`,className: "bar-util-btn2 ",vpack:'center',}),
      powerbtn,

    ]
  })
});
