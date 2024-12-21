import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { execAsync, exec } = Utils;
const { Box, EventBox, Label, Button, Overlay, Revealer, Window, Scrollable } = Widget;
import {
  MinimalPreset,
  GamingPreset,
  FullPreset,
  ToggleIconBluetooth,
  ToggleIconWifi,
  NightLightButton,
  IdleInhibitorButton,
  CloudflareWarpButton,
  RevealerState,
  RevealerButton,
  ModuleNightLight,
  ModuleRawInput,
  ModuleSettingsIcon,
  ModuleIdleInhibitor,
} from "./quicktoggles.js";
import { VolumeSlider } from "./volumeslider.js";
import { BrightnessSlider } from "./brightnessslider.js";
import ModuleNotificationList from "./centermodules/notificationlist.js";
import ModuleAudioControls from "./centermodules/audiocontrols.js";
import ModuleWifiNetworks from "./centermodules/wifinetworks.js";
// import ModulePowerProfiles from "./centermodules/powerprofiles.js";
// import ModuleBluetooth from "./centermodules/bluetooth.js";
import ModuleConfigure from "./centermodules/configure.js";
import ModuleMusicControls from "./centermodules/musiccontrols.js";
import ModuleTaskManager from "./centermodules/taskmanager.js";
// import ModuleMusicControls from "./centermodules/musiccontrols.js";
import { ModuleCalendar } from "./calendar.js";
import { getDistroIcon, getProfilePhoto } from "../.miscutils/system.js";
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
  {
    name: getString("Live config"),
    materialIcon: "tune",
    contentWidget: ModuleConfigure,
  },
];

const timeRow = Widget.Box({
  className: "spacing-h-10 sidebar-toplabel",
  children: [
    Widget.Box({
      vertical: false,
      children: [
        Widget.Box({
          hpack: "start",
          className: "spacing-h-10",
          children: [
            Widget.Box({
              className: "avatar-box",
              setup: self => self.hook(App, () => {
                const profilePhoto = getProfilePhoto();
                console.log('Setting profile photo:', profilePhoto);
                if (profilePhoto && profilePhoto !== '') {
                  self.children = [
                    Widget.Box({
                      className: "avatar-image",
                      css: `
                        background-image: url('${profilePhoto}');
                        background-size: cover;
                        background-position: center;
                        min-width: 36px;
                        min-height: 36px;
                        border-radius: 999px;
                      `,
                    }),
                  ];
                } else {
                  self.children = [
                    Widget.Icon({
                      icon: getDistroIcon(),
                      className: "txt txt-larger txt-mainfont",
                    }),
                  ];
                }
              }),

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
          ],
        }),
        
      ],
    }),
    Widget.Box({ hexpand: true }),
    RevealerButton({ hpack: "start"}),
  ],
});

const togglesBox = Widget.Box({
  className: "spacing-v-10",
  vertical: true,
  children: [
    // Main toggles row
    Widget.Box({
      className: "spacing-h-5",
      hpack: "center",
      children: [
        await ToggleIconWifi(),
        await ToggleIconBluetooth(),
      ]
    }),
    Widget.Box({
      vertical: true,
      className: "spacing-v-5",
      css:"margin-bottom:1rem",
	    children: [
        VolumeSlider(),
        BrightnessSlider(),
      ],
    }),

    // Secondary toggles
    Widget.Box({
      vertical: true,
      children: [
        Widget.Revealer({
          transition: 'slide_down',
          transitionDuration: 180,
          setup: (self) => RevealerState.register(self, 'secondary'),
          child: Widget.Box({
            vertical: true,
            children: [
              Widget.Scrollable({
                // className: 'sidebar-scrollable',
                hscroll: 'always',
                vscroll: 'never',
                // hexpand: true,
                child: Widget.Box({
                  className: "spacing-h-5",
                  css:"margin-bottom:1rem",
			hpack: "center",
                  children: [
                    ModuleNightLight(),
                    ModuleRawInput(),
                    ModuleSettingsIcon(),
                    ModuleIdleInhibitor(),
                    MinimalPreset(),
                    GamingPreset(),
                    FullPreset(),
                    CloudflareWarpButton(),
                  ]
                }),
              }),
              Widget.Box({
                className: "spacing-h-5",
                hpack: "center",
                children: [
                ]
              }),
            ],
          }),
        }),
      ],
    }),
  ],
});

const presets = Widget.Box({
  hpack: "center",
  children: [
    Widget.Box({
      vertical: false,
      css: 'margin-top:0.75rem',
      children: [
        Widget.Box({
          className: "spacing-h-5",
          hpack: "center",
          children: [
            MinimalPreset(),
            GamingPreset(),
            FullPreset(),
          ]
        }),
      ]
    }),
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
  Widget.Box({
    // vexpand: true,
    hexpand: true,
    css: "min-width: 2px;",
    children: [
      Widget.EventBox({
        onPrimaryClick: () => App.closeWindow("sideright"),
        onSecondaryClick: () => App.closeWindow("sideright"),
        onMiddleClick: () => App.closeWindow("sideright"),
      }),
      Widget.Box({
        vertical: true,
        // vexpand: true,
        className: "sidebar-right spacing-v-15",
        children: [
          Widget.Box({
            vertical: true,
            children: [
              Widget.Box({  // Always visible timeRow with revealer button
                vertical: true,
                children: [
                  Widget.Box({
                    children: [timeRow, ],
                  }),
                ],
              }),
              Widget.Revealer({
                revealChild: true,  // Primary buttons visible by default
                transition: "slide_down",
                transitionDuration: 300,
                setup: (self) => {
                  RevealerState.register(self, 'primary');
                  self.hook(RevealerState, () => {
                    self.revealChild = RevealerState.isPrimaryRevealed;
                  });
                },
                child: Widget.Box({
                  vertical: true,
                  children: [togglesBox],
                }),
              }),
              Widget.Box({
                vertical: true,
                className: "spacing-v-10",
                children: [
                  Widget.Box({
                    className: "sidebar-group",
                    children: [sidebarOptionsStack],
                  }),
                  Widget.Box({
			  vexpand:false,
                    vertical: true,
                    children: [ModuleCalendar()],
                  }),

                ],
              }),
             
              Widget.Revealer({
                revealChild: false,  // Secondary buttons hidden by default
                transition: "slide_down",
                transitionDuration: 400,
                setup: (self) => {
                  RevealerState.register(self, 'secondary');
                  self.hook(RevealerState, () => {
                    self.revealChild = RevealerState.isSecondaryRevealed;
                  });
                },
              }),
            ],
          }),
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
