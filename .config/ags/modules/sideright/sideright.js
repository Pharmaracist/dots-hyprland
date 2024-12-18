import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { execAsync, exec } = Utils;
const { Box, EventBox, Label } = Widget;
import RevealerControl from "../bar/modules/revealercontrol.js";
import {
  ToggleIconBluetooth,
  ToggleIconWifi,
  // HyprToggleIcon,
  ModuleNightLight,
  ModuleIdleInhibitor,
  // ModuleReloadIcon,
  // ModuleSettingsIcon,
  ModulePowerIcon,
  // ModuleRawInput,
  ModuleCloudflareWarp,
} from "./quicktoggles.js";
import ModuleNotificationList from "./centermodules/notificationlist.js";
import ModuleAudioControls from "./centermodules/audiocontrols.js";
import ModuleWifiNetworks from "./centermodules/wifinetworks.js";
// import ModulePowerProfiles from "./centermodules/powerprofiles.js";
// import ModuleBluetooth from "./centermodules/bluetooth.js";
// import ModuleConfigure from "./centermodules/configure.js";
import ModuleMusicControls from "./centermodules/musiccontrols.js";
import ModuleTaskManager from "./centermodules/taskmanager.js";
// import ModuleMusicControls from "./centermodules/musiccontrols.js";
import { ModuleCalendar } from "./calendar.js";
import { getDistroIcon } from "../.miscutils/system.js";
// import { MaterialIcon } from "../.commonwidgets/materialicon.js";
import { ExpandingIconTabContainer } from "../.commonwidgets/tabcontainer.js";
import { checkKeybind } from "../.widgetutils/keybind.js";
// import { WWO_CODE, WEATHER_SYMBOL, NIGHT_WEATHER_SYMBOL } from '../.commondata/weather.js';
// import GLib from "gi://GLib";
// import Battery from "resource:///com/github/Aylur/ags/service/battery.js";

const centerWidgets = [
  {
    name: getString("Notifications"),
    materialIcon: "notifications",
    contentWidget: ModuleNotificationList,
  },
  
  {
    name: getString("Audio controls"),
    materialIcon: "volume_up",
    contentWidget: ModuleAudioControls,
  },

  {
    name: getString("Task Manager"),
    materialIcon: "monitor_heart",
    contentWidget: ModuleTaskManager,
  },
  // {
  //   name: getString("Bluetooth"),
  //   materialIcon: "bluetooth",
  //   contentWidget: ModuleBluetooth,
  // },
  // {
  //   name: getString("Wifi networks"),
  //   materialIcon: "wifi",
  //   contentWidget: ModuleWifiNetworks,
  //   onFocus: () => execAsync("nmcli dev wifi list").catch(print),
  // },
  // {
  //   name: getString("Live config"),
  //   materialIcon: "tune",
  //   contentWidget: ModuleConfigure,
  // },
];

const timeRow = Box({
  className: "spacing-h-10 sidebar-group-invisible-morehorizpad",
  css:'padding:1rem',
  children: [
    Widget.Icon({
      icon: getDistroIcon(),
      className: "txt txt-larger",
    }),
    Widget.Label({
      hpack: "center",
      className: "txt-small txt",
      setup: (self) => {
        const getUptime = async () => {
          try {
            await execAsync(["bash", "-c", "uptime -p"]);
            return execAsync([
              "bash",
              "-c",
              `uptime -p | sed -e 's/...//;s/ day\\| days/d/;s/ hour\\| hours/h/;s/ minute\\| minutes/m/;s/,[^,]*//2'`,
            ]);
          } catch {
            return execAsync(["bash", "-c", "uptime"]).then((output) => {
              const uptimeRegex = /up\s+((\d+)\s+days?,\s+)?((\d+):(\d+)),/;
              const matches = uptimeRegex.exec(output);

              if (matches) {
                const days = matches[2] ? parseInt(matches[2]) : 0;
                const hours = matches[4] ? parseInt(matches[4]) : 0;
                const minutes = matches[5] ? parseInt(matches[5]) : 0;

                let formattedUptime = "";

                if (days > 0) {
                  formattedUptime += `${days} d `;
                }
                if (hours > 0) {
                  formattedUptime += `${hours} h `;
                }
                formattedUptime += `${minutes} m`;

                return formattedUptime;
              } else {
                throw new Error("Failed to parse uptime output");
              }
            });
          }
        };

        self.poll(5000, (label) => {
          getUptime()
            .then((upTimeString) => {
              label.label = `${getString("Uptime:")} ${upTimeString}`;
            })
            .catch((err) => {
              console.error(`Failed to fetch uptime: ${err}`);
            });
        });
      },
    }),
    Widget.Box({ hexpand: true }),
    // ModuleReloadIcon({ hpack: "end" }),
    // ModuleSettingsIcon({ hpack: "end" }),
    // ModulePowerIcon({ hpack: "end" }),
  ],
});

const togglesBox = Widget.Box({
  hpack: "center",
  children: [
    Widget.Box({
      vertical:true,
      className: "spacing-v-15 ",
    children: [
      await  ToggleIconWifi(),
      await ToggleIconBluetooth(),
    ]
   }),
   Widget.Box({
    className: "spacing-v-15 ",
    vertical:true,
    children: [
      await ModuleNightLight(),
      ModuleIdleInhibitor(),
      RevealerControl(),
      // await ModuleCloudflareWarp(),
    ]
   }), 
   // await ModuleRawInput(),
    // await HyprToggleIcon('touchpad_mouse', 'No touchpad while typing', 'input:touchpad:disable_while_typing', {}),
  ],
});

export const sidebarOptionsStack = ExpandingIconTabContainer({
  tabsHpack: "center",
  tabSwitcherClassName: "sidebar-icontabswitcher",
  icons: centerWidgets.map((api) => api.materialIcon),
  names: centerWidgets.map((api) => api.name),
  children: centerWidgets.map((api) => api.contentWidget()),
  onChange: (self, id) => {
    self.shown = centerWidgets[id].name;
    if (centerWidgets[id].onFocus) centerWidgets[id].onFocus();
  },
});

export default () =>
  Box({
    vexpand: true,
    hexpand: true,
    css: "min-width: 2px;",
    children: [
      EventBox({
        onPrimaryClick: () => App.closeWindow("sideright"),
        onSecondaryClick: () => App.closeWindow("sideright"),
        onMiddleClick: () => App.closeWindow("sideright"),
      }),
      Box({
        vertical: true,
        vexpand: true,
        className: "sidebar-right spacing-v-10",
        children: [
          Box({
            vertical: true,
            // className: "sidebar-group",

            children: [ timeRow,togglesBox],
          }),
          Box({
            className: "sidebar-group",
            children: [sidebarOptionsStack],
          }),
          Box({
            vexpand: false,
            children: [ModuleCalendar()],
          }),
          ModuleMusicControls(),
          // Box({
          //   children: [timeRow],
          // }),
        ],
      }),
    ],
    setup: (self) =>
      self.on("key-press-event", (widget, event) => {
        // Handle keybinds
        if (
          checkKeybind(
            event,
            userOptions.asyncGet().keybinds.sidebar.options.nextTab,
          )
        ) {
          sidebarOptionsStack.nextTab();
        } else if (
          checkKeybind(
            event,
            userOptions.asyncGet().keybinds.sidebar.options.prevTab,
          )
        ) {
          sidebarOptionsStack.prevTab();
        }
      }),
  });
