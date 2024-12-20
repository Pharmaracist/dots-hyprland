import GLib from 'gi://GLib';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Icon, Label, Scrollable, Slider, Stack } = Widget;
const { execAsync, exec } = Utils;
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import { ConfigGap, ConfigSpinButton, ConfigToggle } from '../../.commonwidgets/configwidgets.js';
import { config } from '../../../variables.js';
import { getString } from '../../../i18n/i18n.js';

const HyprlandToggle = ({ icon, name, desc = null, option, enableValue = 1, disableValue = 0, extraOnChange = () => { } }) => ConfigToggle({
    icon: icon,
    name: name,
    desc: desc,
    initValue: JSON.parse(exec(`hyprctl getoption -j ${option}`))["int"] != 0,
    onChange: (self, newValue) => {
        execAsync(['hyprctl', 'keyword', option, `${newValue ? enableValue : disableValue}`]).catch(print);
        extraOnChange(self, newValue);
    }
});

const HyprlandSpinButton = ({ icon, name, desc = null, option, ...rest }) => ConfigSpinButton({
    icon: icon,
    name: name,
    desc: desc,
    initValue: Number(JSON.parse(exec(`hyprctl getoption -j ${option}`))["int"]),
    onChange: (self, newValue) => {
        execAsync(['hyprctl', 'keyword', option, `${newValue}`]).catch(print);
    },
    ...rest,
});

const Subcategory = (children) => Box({
    className: 'margin-left-20',
    vertical: true,
    children: children,
})

export default (props) => {
    const ConfigSection = ({ name, children }) => Box({
        vertical: true,
        className: 'spacing-v-5',
        children: [
            Label({
                hpack: 'center',
                className: 'txt txt-large margin-left-10',
                label: name,
            }),
            Box({
                className: 'margin-left-10 margin-right-10',
                vertical: true,
                children: children,
            })
        ]
    })
    const mainContent = Scrollable({
        vexpand: true,
        child: Box({
            vertical: true,
            className: 'spacing-v-10',
            children: [
                ConfigSection({
                    name: getString('Effects'), children: [
                        ConfigToggle({
                            icon: 'border_clear',
                            name: getString('Transparency'),
                            desc: getString('[AGS]\nMake shell elements transparent\nBlur is also recommended if you enable this'),
                            initValue: exec(`bash -c "sed -n \'2p\' ${GLib.get_user_state_dir()}/ags/user/colormode.txt"`) == "transparent",
                            onChange: (self, newValue) => {
                                const transparency = newValue == 0 ? "opaque" : "transparent";
                                console.log(transparency);
                                execAsync([`bash`, `-c`, `mkdir -p ${GLib.get_user_state_dir()}/ags/user && sed -i "2s/.*/${transparency}/"  ${GLib.get_user_state_dir()}/ags/user/colormode.txt`])
                                    .then(execAsync(['bash', '-c', `${App.configDir}/scripts/color_generation/switchcolor.sh`]))
                                    .catch(print);
                            },
                        }),
                        HyprlandToggle({ icon: 'blur_on', name: getString('Blur'), desc: getString("[Hyprland]\nEnable blur on transparent elements\nDoesn't affect performance/power consumption unless you have transparent windows."), option: "decoration:blur:enabled" }),
                        Subcategory([
                            HyprlandToggle({ icon: 'stack_off', name: getString('X-ray'), desc: getString("[Hyprland]\nMake everything behind a window/layer except the wallpaper not rendered on its blurred surface\nRecommended to improve performance (if you don't abuse transparency/blur) "), option: "decoration:blur:xray" }),
                            HyprlandSpinButton({ icon: 'target', name: getString('Size'), desc: getString('[Hyprland]\nAdjust the blur radius. Generally doesn\'t affect performance\nHigher = more color spread'), option: 'decoration:blur:size', minValue: 1, maxValue: 1000 }),
                            HyprlandSpinButton({ icon: 'repeat', name: getString('Passes'), desc: getString('[Hyprland] Adjust the number of runs of the blur algorithm\nMore passes = more spread and power consumption\n4 is recommended\n2- would look weird and 6+ would look lame.'), option: 'decoration:blur:passes', minValue: 1, maxValue: 10 }),
                        ]),
                        ConfigGap({}),
                        HyprlandToggle({
                            icon: 'animation', name: getString('Animations'), desc: getString('[Hyprland] [GTK]\nEnable animations'), option: 'animations:enabled',
                            extraOnChange: (self, newValue) => execAsync(['gsettings', 'set', 'org.gnome.desktop.interface', 'enable-animations', `${newValue}`])
                        }),
                        Subcategory([
                            ConfigSpinButton({
                                icon: 'clear_all',
                                name: getString('Choreography delay'),
                                desc: getString('In milliseconds, the delay between animations of a series'),
                                initValue: config.value.animations.choreographyDelay,
                                step: 10, minValue: 0, maxValue: 1000,
                                onChange: (self, newValue) => {
                                    config.value.animations.choreographyDelay = newValue
                                },
                            })
                        ]),
                    ]
                }),
                ConfigSection({
                    name: getString('Modules'),
                    children: [
                        // Core UI
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10',
                            label: getString('Core UI'),
                        }),
                        Subcategory([
                            ConfigToggle({
                                icon: 'horizontal_distribute',
                                name: getString('Bar'),
                                desc: getString('Enable/disable the top bar module'),
                                initValue: config.value.modules?.bar !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('bar');
                                },
                            }),
                            ConfigToggle({
                                icon: 'dock_to_bottom',
                                name: getString('Dock'),
                                desc: getString('Enable/disable the dock module'),
                                initValue: config.value.modules?.dock !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('dock');
                                },
                            }),
                            ConfigToggle({
                                icon: 'chevron_left',
                                name: getString('Left Sidebar'),
                                desc: getString('Enable/disable the left sidebar module'),
                                initValue: config.value.modules?.sideleft !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('sideleft');
                                },
                            }),
                            ConfigToggle({
                                icon: 'chevron_right',
                                name: getString('Right Sidebar'),
                                desc: getString('Enable/disable the right sidebar module'),
                                initValue: config.value.modules?.sideright !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('sideright');
                                },
                            }),
                        ]),
                        
                        // Overlays and Utilities
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Overlays and Utilities'),
                        }),
                        Subcategory([
                            ConfigToggle({
                                icon: 'grid_view',
                                name: getString('Overview'),
                                desc: getString('Enable/disable the overview module'),
                                initValue: config.value.modules?.overview !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('overview');
                                },
                            }),
                            ConfigToggle({
                                icon: 'help',
                                name: getString('Cheatsheet'),
                                desc: getString('Enable/disable the cheatsheet module'),
                                initValue: config.value.modules?.cheatsheet !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('cheatsheet');
                                },
                            }),
                            ConfigToggle({
                                icon: 'info',
                                name: getString('Indicators'),
                                desc: getString('Enable/disable the indicators module'),
                                initValue: config.value.modules?.indicators !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('indicators');
                                },
                            }),
                            ConfigToggle({
                                icon: 'account_circle',
                                name: getString('Session'),
                                desc: getString('Enable/disable the session module'),
                                initValue: config.value.modules?.session !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('session');
                                },
                            }),
                        ]),
                        
                        // Visual Elements
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Visual Elements'),
                        }),
                        Subcategory([
                            ConfigToggle({
                                icon: 'rounded_corner',
                                name: getString('Screen Corners'),
                                desc: getString('Enable/disable the screen corners module'),
                                initValue: config.value.modules?.screencorners !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('screencorners');
                                },
                            }),
                            ConfigToggle({
                                icon: 'image',
                                name: getString('Desktop Background'),
                                desc: getString('Enable/disable the desktop background module'),
                                initValue: config.value.modules?.desktopbackground !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('desktopbackground');
                                },
                            }),
                            ConfigToggle({
                                icon: 'wallpaper',
                                name: getString('Wallpaper Selector'),
                                desc: getString('Enable/disable the wallpaper selector module'),
                                initValue: config.value.modules?.wallselect !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('wallselect');
                                },
                            }),
                        ]),
                        
                        // Additional Features
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Additional Features'),
                        }),
                        Subcategory([
                            ConfigToggle({
                                icon: 'keyboard',
                                name: getString('On-Screen Keyboard'),
                                desc: getString('Enable/disable the on-screen keyboard module'),
                                initValue: config.value.modules?.onscreenkeyboard === true,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('onscreenkeyboard');
                                },
                            }),
                            ConfigToggle({
                                icon: 'gps_fixed',
                                name: getString('Crosshair'),
                                desc: getString('Enable/disable the crosshair overlay module'),
                                initValue: config.value.modules?.crosshair === true,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('crosshair');
                                },
                            }),
                        ]),
                    ],
                }),
                ConfigSection({
                    name: getString('Developer'), children: [
                        ConfigToggle({
                            icon: 'developer_mode',
                            name: getString('Developer mode'),
                            desc: getString("Show development widgets\nCurrently controls battery widget visibility"),
                            initValue: globalThis.devMode.value,
                            onChange: (self, newValue) => {
                                globalThis.devMode.setValue(newValue);
                            },
                        }),
                        HyprlandToggle({ icon: 'speed', name: getString('Show FPS'), desc: getString("[Hyprland]\nShow FPS overlay on top-left corner"), option: "debug:overlay" }),
                        HyprlandToggle({ icon: 'sort', name: getString('Log to stdout'), desc: getString("[Hyprland]\nPrint LOG, ERR, WARN, etc. messages to the console"), option: "debug:enable_stdout_logs" }),
                        HyprlandToggle({ icon: 'motion_sensor_active', name: getString('Damage tracking'), desc: getString("[Hyprland]\nEnable damage tracking\nGenerally, leave it on.\nTurn off only when a shader doesn't work"), option: "debug:damage_tracking", enableValue: 2 }),
                        HyprlandToggle({ icon: 'destruction', name: getString('Damage blink'), desc: getString("[Hyprland] [Epilepsy warning!]\nShow screen damage flashes"), option: "debug:damage_blink" }),
                    ]
                }),
            ]
        })
    });
   
    return Box({
        ...props,
        className: 'spacing-v-5',
        vertical: true,
        children: [
            mainContent,
        ]
    });
}
