import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync, exec } = Utils;
const { Box, EventBox, Label } = Widget;
import {
    ToggleIconBluetooth,
    ToggleIconWifi,
    HyprToggleIcon,
    ModuleNightLight,
    ModuleIdleInhibitor,
    ModuleReloadIcon,
    ModuleSettingsIcon,
    ModulePowerIcon,
    ModuleRawInput,
    ModuleCloudflareWarp
} from "./quicktoggles.js";
import ModuleNotificationList from "./centermodules/notificationlist.js";
import ModuleAudioControls from "./centermodules/audiocontrols.js";
import ModuleWifiNetworks from "./centermodules/wifinetworks.js";
import ModulePowerProfiles from './centermodules/powerprofiles.js';
import ModuleBluetooth from "./centermodules/bluetooth.js";
import ModuleConfigure from "./centermodules/configure.js";
import { ModuleCalendar } from "./calendar.js";
import { getDistroIcon } from '../.miscutils/system.js';
import { MaterialIcon } from '../.commonwidgets/materialicon.js';
import { ExpandingIconTabContainer } from '../.commonwidgets/tabcontainer.js';
import { checkKeybind } from '../.widgetutils/keybind.js';
import { WWO_CODE, WEATHER_SYMBOL, NIGHT_WEATHER_SYMBOL } from '../.commondata/weather.js';
import GLib from 'gi://GLib';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

const centerWidgets = [
    {
        name: getString('Notifications'),
        materialIcon: 'notifications',
        contentWidget: ModuleNotificationList,
    },
    {
        name: getString('Audio controls'),
        materialIcon: 'volume_up',
        contentWidget: ModuleAudioControls,
    },
    ...(Battery.available ? [{
        name: 'Power Profiles',
        materialIcon: 'speed',
        contentWidget: ModulePowerProfiles,
    }] : []),
    {
        name: getString('Bluetooth'),
        materialIcon: 'bluetooth',
        contentWidget: ModuleBluetooth,
    },
    {
        name: getString('Wifi networks'),
        materialIcon: 'wifi',
        contentWidget: ModuleWifiNetworks,
        onFocus: () => execAsync('nmcli dev wifi list').catch(print),
    },
    {
        name: getString('Live config'),
        materialIcon: 'tune',
        contentWidget: ModuleConfigure,
    },
];

const timeRow = Box({
    className: 'spacing-h-10 sidebar-group-invisible-morehorizpad',
    children: [
        Widget.Icon({
            icon: getDistroIcon(),
            className: 'txt txt-larger',
        }),
        Widget.Label({
            hpack: 'center',
            className: 'txt-small txt',
            setup: (self) => {
                const getUptime = async () => {
                    try {
                        await execAsync(['bash', '-c', 'uptime -p']);
                        return execAsync(['bash', '-c', `uptime -p | sed -e 's/...//;s/ day\\| days/d/;s/ hour\\| hours/h/;s/ minute\\| minutes/m/;s/,[^,]*//2'`]);
                    } catch {
                        return execAsync(['bash', '-c', 'uptime']).then(output => {
                            const uptimeRegex = /up\s+((\d+)\s+days?,\s+)?((\d+):(\d+)),/;
                            const matches = uptimeRegex.exec(output);

                            if (matches) {
                                const days = matches[2] ? parseInt(matches[2]) : 0;
                                const hours = matches[4] ? parseInt(matches[4]) : 0;
                                const minutes = matches[5] ? parseInt(matches[5]) : 0;

                                let formattedUptime = '';

                                if (days > 0) {
                                    formattedUptime += `${days} d `;
                                }
                                if (hours > 0) {
                                    formattedUptime += `${hours} h `;
                                }
                                formattedUptime += `${minutes} m`;

                                return formattedUptime;
                            } else {
                                throw new Error('Failed to parse uptime output');
                            }
                        });
                    }
                };

                self.poll(5000, label => {
                    getUptime().then(upTimeString => {
                        label.label = `${getString("Uptime:"
                        )} ${upTimeString}`;
                    }).catch(err => {
                        console.error(`Failed to fetch uptime: ${err}`);
                    });
                });
            },
        }),
        Widget.Box({ hexpand: true }),
        ModuleReloadIcon({ hpack: 'end' }),
        ModuleSettingsIcon({ hpack: 'end' }),
        ModulePowerIcon({ hpack: 'end' }),
    ]
});

const togglesBox = Widget.Box({
    hpack: 'center',
    className: 'sidebar-togglesbox spacing-h-5',
    children: [
        ToggleIconWifi(),
        ToggleIconBluetooth(),
        // await ModuleRawInput(),
        // await HyprToggleIcon('touchpad_mouse', 'No touchpad while typing', 'input:touchpad:disable_while_typing', {}),
        await ModuleNightLight(),
        ModuleIdleInhibitor(),
        await ModuleCloudflareWarp(),
    ]
})

export const sidebarOptionsStack = ExpandingIconTabContainer({
    tabsHpack: 'center',
    tabSwitcherClassName: 'sidebar-icontabswitcher',
    icons: centerWidgets.map((api) => api.materialIcon),
    names: centerWidgets.map((api) => api.name),
    children: centerWidgets.map((api) => api.contentWidget()),
    onChange: (self, id) => {
        self.shown = centerWidgets[id].name;
        if (centerWidgets[id].onFocus) centerWidgets[id].onFocus();
    }
});

const WeatherWidget = () => {
    const options = userOptions.asyncGet();
    const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
    const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + '/wttr.in.txt';
    
    const updateWeather = async () => {
        try {
            await Utils.execAsync(['mkdir', '-p', WEATHER_CACHE_FOLDER]);
            const city = options.weather.city || 'London';
            const url = `wttr.in/${city}?format=Weather:%20%c,%20Condition:%20%C,%20Temperature:%20%t,%20Wind:%20%w`;
            await Utils.execAsync(['curl', '-s', url, '-o', WEATHER_CACHE_PATH]);
        } catch (error) {
            console.error('Failed to update weather:', error);
        }
    };

    updateWeather();
    Utils.interval(900000, updateWeather);
    
    return Box({
        hexpand: true,
        hpack: 'center',
        className: 'spacing-h-10',
        children: [
            MaterialIcon('location_on', 'small'),
            Label({
                className: 'txt-smallie',
                label: options.weather.city || 'Unknown',
            }),
            MaterialIcon('device_thermostat', 'small'),
            Label({
                className: 'txt-smallie',
                setup: (self) => self.poll(900000, async (label) => {
                    try {
                        const temp = await Utils.execAsync(['grep', '-o', 'Temperature: [^,]*', WEATHER_CACHE_PATH]);
                        label.label = temp?.trim().split(': ')[1] || 'N/A';
                    } catch (error) {
                        label.label = 'N/A';
                    }
                }),
            }),
            Label({
                className: 'txt-norm icon-material',
                setup: (self) => self.poll(900000, async (label) => {
                    try {
                        const code = await Utils.execAsync(['grep', '-o', 'Weather: [^,]*', WEATHER_CACHE_PATH]);
                        const weatherCode = code?.trim().split(' ')[1];
                        if (!weatherCode || !WWO_CODE[weatherCode]) {
                            label.label = 'cloud_off';
                            return;
                        }
                        const condition = WWO_CODE[weatherCode];
                        const isNight = GLib.DateTime.new_now_local().get_hour() >= 20 || GLib.DateTime.new_now_local().get_hour() <= 6;
                        label.label = isNight ? NIGHT_WEATHER_SYMBOL[condition] || 'cloud_off' : WEATHER_SYMBOL[condition] || 'cloud_off';
                    } catch (error) {
                        label.label = 'cloud_off';
                    }
                }),
            }),
            MaterialIcon('air', 'small'),
            Label({
                className: 'txt-smallie',
                setup: (self) => self.poll(900000, async (label) => {
                    try {
                        const wind = await Utils.execAsync(['grep', '-o', 'Wind: [^,]*', WEATHER_CACHE_PATH]);
                        const windMatch = wind?.trim().match(/\d+\s*km\/h/);
                        label.label = windMatch ? windMatch[0] : 'N/A';
                    } catch (error) {
                        label.label = 'N/A';
                    }
                }),
            }),
        ]
    });
};

export default () => Box({
    vexpand: true,
    hexpand: true,
    css: 'min-width: 2px;',
    children: [
        EventBox({
            onPrimaryClick: () => App.closeWindow('sideright'),
            onSecondaryClick: () => App.closeWindow('sideright'),
            onMiddleClick: () => App.closeWindow('sideright'),
        }),
        Box({
            vertical: true,
            vexpand: true,
            className: 'sidebar-right spacing-v-15',
            children: [
                Box({
                    vertical: true,
                    className: 'spacing-v-5',
                    children: [
                        timeRow,
                        togglesBox,
                    ]
                }),
                Box({
                    className: 'sidebar-group',
                    children: [
                        sidebarOptionsStack,
                    ],
                }),
                ModuleCalendar(),
                WeatherWidget(),
            ]
        }),
    ],
    setup: (self) => self
        .on('key-press-event', (widget, event) => { // Handle keybinds
            if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.options.nextTab)) {
                sidebarOptionsStack.nextTab();
            }
            else if (checkKeybind(event, userOptions.asyncGet().keybinds.sidebar.options.prevTab)) {
                sidebarOptionsStack.prevTab();
            }
        })
    ,
});
