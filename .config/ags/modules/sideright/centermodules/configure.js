import GLib from 'gi://GLib';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button, Icon, Label, Scrollable, Slider, Stack } = Widget;
const { execAsync, exec } = Utils;
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import { ConfigGap, ConfigSpinButton, ConfigToggle, ConfigSegmentedSelection } from '../../.commonwidgets/configwidgets.js';
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

const EditButton = ({ tooltipText, onClicked }) => Button({
    className: 'txt-norm icon-material',
    label: 'settings',
    tooltipText: tooltipText,
    onClicked: onClicked,
});

// Helper function for default app selection
const chooseDefaultApp = (mimeType, currentApp, title) => {
    // Get list of desktop files
    const getDesktopFiles = () => {
        const apps = Utils.exec('find /usr/share/applications -name "*.desktop"').split('\n')
            .concat(Utils.exec('find ~/.local/share/applications -name "*.desktop"').split('\n'))
            .filter(f => f); // Remove empty strings

        const choices = [];
        for (const app of apps) {
            const content = Utils.exec(`cat "${app}"`);
            const name = content.match(/^Name=(.*)$/m)?.[1];
            const mimeTypes = content.match(/^MimeType=(.*)$/m)?.[1]?.split(';') || [];
            
            if (name && (mimeTypes.includes(mimeType) || app.includes(mimeType.split('/')[0]))) {
                choices.push(`${name}:${app}`);
            }
        }
        return choices.sort();
    };

    const choices = getDesktopFiles();
    if (choices.length > 0) {
        Utils.execAsync(['bash', '-c', `echo "${choices.join('\n')}" | wofi --show dmenu -p "${title}"`])
            .then(selected => {
                if (selected) {
                    const desktopFile = selected.split(':')[1].trim();
                    // Use gio to set the default application
                    Utils.execAsync(['gio', 'mime', mimeType, desktopFile])
                        .then(() => {
                            if (!config.value.defaultApplications) config.value.defaultApplications = {};
                            config.value.defaultApplications[mimeType] = desktopFile;
                            config.write();
                            
                            // Update the display immediately
                            const currentLabel = document.querySelector(`[data-mime-type="${mimeType}"]`);
                            if (currentLabel) {
                                const defaultApp = Utils.exec(`gio mime ${mimeType}`).split('\n')
                                    .find(line => line.includes('Default application'))?.split(': ')[1] || 'Not set';
                                currentLabel.label = defaultApp;
                            }

                            // Also update XDG associations
                            Utils.execAsync(['xdg-mime', 'default', desktopFile.split('/').pop(), mimeType]);
                            
                            // Update mimeapps.list
                            const mimeappsDir = `${GLib.get_user_config_dir()}/mimeapps.list`;
                            const desktopEntry = desktopFile.split('/').pop();
                            
                            // Properly escape the sed pattern
                            const escapedMimeType = mimeType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            
                            Utils.execAsync(['bash', '-c', `
                                if [ ! -f "${mimeappsDir}" ]; then
                                    mkdir -p "$(dirname "${mimeappsDir}")"
                                    echo "[Default Applications]" > "${mimeappsDir}"
                                elif ! grep -q "\\[Default Applications\\]" "${mimeappsDir}"; then
                                    echo "[Default Applications]" >> "${mimeappsDir}"
                                fi
                                sed -i "/^${escapedMimeType}=/d" "${mimeappsDir}"
                                echo "${mimeType}=${desktopEntry}" >> "${mimeappsDir}"
                            `]);
                        })
                        .catch(print);
                }
            })
            .catch(print);
    }
};

// Helper function to get current default app
const getCurrentDefault = (mimeType) => {
    const gioDefault = Utils.exec(`gio mime ${mimeType}`).split('\n')
        .find(line => line.includes('Default application'))?.split(': ')[1];
    if (gioDefault) return gioDefault;

    const xdgDefault = Utils.exec(`xdg-mime query default ${mimeType}`).trim();
    if (xdgDefault) {
        const desktopFile = `/usr/share/applications/${xdgDefault}`;
        if (Utils.exec(`test -f "${desktopFile}" && echo "exists"`)) {
            const name = Utils.exec(`grep -oP "(?<=^Name=).*" "${desktopFile}" | head -1`).trim();
            return name || xdgDefault;
        }
    }
    return 'Not set';
};

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
                            icon: 'animation', name: getString('Animations'), desc: getString('[Hyprland] [GTK]\nEnable animations'), option: "animations:enabled",
                            extraOnChange: (self, newValue) => {
                                const config = userOptions.asyncGet();
                                if (!config.animations) config.animations = {};
                                config.animations.enabled = newValue;
                                userOptions.set(config);
                                execAsync(['gsettings', 'set', 'org.gnome.desktop.interface', 'enable-animations', `${newValue}`]);
                            }
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
                            Label({
                                hpack: 'start',
                                className: 'txt txt-bold margin-left-10 margin-top-10',
                                label: getString('Profile Photo'),
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('account_circle', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Current Photo'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value['profile-photo'] || 'Not set',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Change profile photo'),
                                        onClicked: () => {
                                            Utils.execAsync(['bash', '-c', `${App.configDir}/scripts/set_profile_photo.sh`])
                                                .then(() => {
                                                    config.value['profile-photo'] = exec('bash -c "cat ~/.face.path"').trim();
                                                    config.write();
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            ConfigToggle({
                                icon: 'rounded_corner',
                                name: getString('Screen Corners'),
                                desc: getString('Enable/disable the screen corners module'),
                                initValue: config.value.modules?.screencorners !== false,
                                onChange: (self, newValue) => {
                                    globalThis.toggleModule('screencorners');
                                },
                            }),
                        ]),
                        
                        // Auto Dark Mode
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Auto Dark Mode'),
                        }),
                        Subcategory([
                            ConfigToggle({
                                icon: 'dark_mode',
                                name: getString('Auto Dark Mode'),
                                desc: getString('Automatically switch between light and dark theme'),
                                initValue: config.value.appearance?.autoDarkMode?.enabled !== false,
                                onChange: (self, newValue) => {
                                    config.value.appearance.autoDarkMode.enabled = newValue;
                                    config.write();
                                },
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('schedule', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Dark Mode Start'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.appearance?.autoDarkMode?.from || '18:00',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set dark mode start time'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--entry', 
                                                '--title=Dark Mode Start Time',
                                                '--text=Enter time in HH:MM format (24h)',
                                                '--entry-text=' + (config.value.appearance?.autoDarkMode?.from || '18:00')])
                                                .then(time => {
                                                    if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time.trim())) {
                                                        config.value.appearance.autoDarkMode.from = time.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('schedule', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Dark Mode End'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.appearance?.autoDarkMode?.to || '06:00',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set dark mode end time'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Dark Mode End Time',
                                                '--text=Enter time in HH:MM format (24h)',
                                                '--entry-text=' + (config.value.appearance?.autoDarkMode?.to || '06:00')])
                                                .then(time => {
                                                    if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time.trim())) {
                                                        config.value.appearance.autoDarkMode.to = time.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Default Applications
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Default Applications'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('language', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Web Browser'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: getCurrentDefault('x-scheme-handler/http'),
                                                attribute: { 'data-mime-type': 'x-scheme-handler/http' },
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default browser'),
                                        onClicked: () => chooseDefaultApp('x-scheme-handler/http', 
                                            config.value.defaultApplications?.browser, 
                                            'Choose Default Browser'),
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('folder_open', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('File Manager'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: getCurrentDefault('inode/directory'),
                                                attribute: { 'data-mime-type': 'inode/directory' },
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default file manager'),
                                        onClicked: () => chooseDefaultApp('inode/directory',
                                            config.value.defaultApplications?.fileManager,
                                            'Choose Default File Manager'),
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('terminal', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Terminal'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: getCurrentDefault('x-scheme-handler/terminal'),
                                                attribute: { 'data-mime-type': 'x-scheme-handler/terminal' },
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default terminal'),
                                        onClicked: () => chooseDefaultApp('x-scheme-handler/terminal',
                                            config.value.defaultApplications?.terminal,
                                            'Choose Default Terminal'),
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('edit_document', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Text Editor'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: getCurrentDefault('text/plain'),
                                                attribute: { 'data-mime-type': 'text/plain' },
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default text editor'),
                                        onClicked: () => chooseDefaultApp('text/plain',
                                            config.value.defaultApplications?.textEditor,
                                            'Choose Default Text Editor'),
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('calculate', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Calculator'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: getCurrentDefault('x-scheme-handler/calculator'),
                                                attribute: { 'data-mime-type': 'x-scheme-handler/calculator' },
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default calculator'),
                                        onClicked: () => chooseDefaultApp('x-scheme-handler/calculator',
                                            config.value.defaultApplications?.calculator,
                                            'Choose Default Calculator'),
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('image', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Image Viewer'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: getCurrentDefault('image/png'),
                                                attribute: { 'data-mime-type': 'image/png' },
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default image viewer'),
                                        onClicked: () => chooseDefaultApp('image/png',
                                            config.value.defaultApplications?.imageViewer,
                                            'Choose Default Image Viewer'),
                                    }),
                                ]
                            }),
                        ]),
                        // Animation Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Animation Settings'),
                        }),
                        Subcategory([
                            ConfigSpinButton({
                                icon: 'speed',
                                name: getString('Small Duration'),
                                desc: getString('Duration for small animations (ms)'),
                                initValue: config.value.animations?.durationSmall || 110,
                                minValue: 0,
                                maxValue: 500,
                                onChange: (value) => {
                                    config.value.animations.durationSmall = value;
                                    config.write();
                                },
                            }),
                            ConfigSpinButton({
                                icon: 'speed',
                                name: getString('Large Duration'),
                                desc: getString('Duration for large animations (ms)'),
                                initValue: config.value.animations?.durationLarge || 180,
                                minValue: 0,
                                maxValue: 1000,
                                onChange: (value) => {
                                    config.value.animations.durationLarge = value;
                                    config.write();
                                },
                            }),
                            ConfigSpinButton({
                                icon: 'timer',
                                name: getString('Choreography Delay'),
                                desc: getString('Delay between choreographed animations (ms)'),
                                initValue: config.value.animations?.choreographyDelay || 25,
                                minValue: 0,
                                maxValue: 200,
                                onChange: (value) => {
                                    config.value.animations.choreographyDelay = value;
                                    config.write();
                                },
                            }),
                        ]),

                        // Developer
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

                        // AI Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('AI Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('smart_toy', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Default GPT Provider'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.ai?.defaultGPTProvider || 'openrouter',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Choose default GPT provider'),
                                        onClicked: () => {
                                            const providers = ['openrouter', 'gemini', 'anthropic'];
                                            Utils.execAsync(['bash', '-c', `echo "${providers.join('\n')}" | wofi --show dmenu -p "Choose GPT provider"`])
                                                .then(provider => {
                                                    if (provider) {
                                                        config.value.ai.defaultGPTProvider = provider.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            ConfigToggle({
                                icon: 'history',
                                name: getString('Use History'),
                                desc: getString('Enable chat history'),
                                initValue: config.value.ai?.useHistory !== false,
                                onChange: (self, newValue) => {
                                    config.value.ai.useHistory = newValue;
                                    config.write();
                                },
                            }),
                            ConfigToggle({
                                icon: 'security',
                                name: getString('Safety'),
                                desc: getString('Enable AI safety features'),
                                initValue: config.value.ai?.safety !== false,
                                onChange: (self, newValue) => {
                                    config.value.ai.safety = newValue;
                                    config.write();
                                },
                            }),
                        ]),

                        // Battery Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Battery Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('battery_alert', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Low Battery Level'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${config.value.battery?.low || 20}%`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set low battery threshold'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale', 
                                                '--title=Low Battery Threshold',
                                                '--text=Set low battery warning threshold',
                                                '--min-value=5',
                                                '--max-value=50',
                                                '--value=' + (config.value.battery?.low || 20)])
                                                .then(value => {
                                                    if (value) {
                                                        config.value.battery.low = parseInt(value);
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('battery_0_bar', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Critical Battery Level'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${config.value.battery?.critical || 10}%`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set critical battery threshold'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Critical Battery Threshold',
                                                '--text=Set critical battery warning threshold',
                                                '--min-value=1',
                                                '--max-value=20',
                                                '--value=' + (config.value.battery?.critical || 10)])
                                                .then(value => {
                                                    if (value) {
                                                        config.value.battery.critical = parseInt(value);
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('power', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Auto Suspend Level'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${config.value.battery?.suspendThreshold || 3}%`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set auto suspend threshold'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Auto Suspend Threshold',
                                                '--text=Set battery level for automatic suspension',
                                                '--min-value=1',
                                                '--max-value=10',
                                                '--value=' + (config.value.battery?.suspendThreshold || 3)])
                                                .then(value => {
                                                    if (value) {
                                                        config.value.battery.suspendThreshold = parseInt(value);
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Gaming Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Gaming'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('gps_fixed', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Crosshair Size'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${config.value.gaming?.crosshair?.size || 20}px`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set crosshair size'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Crosshair Size',
                                                '--text=Set crosshair size in pixels',
                                                '--min-value=10',
                                                '--max-value=50',
                                                '--value=' + (config.value.gaming?.crosshair?.size || 20)])
                                                .then(value => {
                                                    if (value) {
                                                        if (!config.value.gaming) config.value.gaming = {};
                                                        if (!config.value.gaming.crosshair) config.value.gaming.crosshair = {};
                                                        config.value.gaming.crosshair.size = parseInt(value);
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('palette', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Crosshair Color'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.gaming?.crosshair?.color || 'rgba(113,227,32,0.9)',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set crosshair color'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--color-selection',
                                                '--title=Crosshair Color',
                                                '--show-palette'])
                                                .then(color => {
                                                    if (color) {
                                                        if (!config.value.gaming) config.value.gaming = {};
                                                        if (!config.value.gaming.crosshair) config.value.gaming.crosshair = {};
                                                        config.value.gaming.crosshair.color = color.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Overview Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Overview'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('grid_view', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Grid Layout'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${config.value.overview?.numOfRows || 2}x${config.value.overview?.numOfCols || 5}`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set overview grid layout'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--forms',
                                                '--title=Overview Grid Layout',
                                                '--text=Set grid dimensions',
                                                '--add-entry=Number of rows',
                                                '--add-entry=Number of columns'])
                                                .then(result => {
                                                    if (result) {
                                                        const [rows, cols] = result.split('|');
                                                        if (rows && cols) {
                                                            config.value.overview.numOfRows = parseInt(rows);
                                                            config.value.overview.numOfCols = parseInt(cols);
                                                            config.write();
                                                        }
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('zoom_out_map', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Window Scale'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${config.value.overview?.scale || 0.18}`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set window scale in overview'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Window Scale',
                                                '--text=Set window scale in overview',
                                                '--min-value=10',
                                                '--max-value=50',
                                                '--value=' + Math.round((config.value.overview?.scale || 0.18) * 100)])
                                                .then(value => {
                                                    if (value) {
                                                        config.value.overview.scale = parseInt(value) / 100;
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),
                        // Time Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Time Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('schedule', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Time Format'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.time?.format || '%I:%M',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set time format'),
                                        onClicked: () => {
                                            const formats = ['%H:%M', '%I:%M', '%H:%M:%S', '%I:%M %p'];
                                            Utils.execAsync(['bash', '-c', `echo "${formats.join('\n')}" | wofi --show dmenu -p "Choose time format"`])
                                                .then(format => {
                                                    if (format) {
                                                        config.value.time.format = format.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('calendar_month', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Date Format'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.time?.dateFormat || '%d/%m',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set date format'),
                                        onClicked: () => {
                                            const formats = ['%d/%m', '%m/%d', '%Y-%m-%d', '%d/%m/%Y'];
                                            Utils.execAsync(['bash', '-c', `echo "${formats.join('\n')}" | wofi --show dmenu -p "Choose date format"`])
                                                .then(format => {
                                                    if (format) {
                                                        config.value.time.dateFormat = format.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),
                        // Search Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Search Settings'),
                        }),
                        Subcategory([
                            ConfigToggle({
                                icon: 'search',
                                name: getString('AI Search'),
                                desc: getString('Enable AI-powered search results'),
                                initValue: config.value.search?.enableFeatures?.aiSearch !== false,
                                onChange: (self, newValue) => {
                                    if (!config.value.search.enableFeatures) config.value.search.enableFeatures = {};
                                    config.value.search.enableFeatures.aiSearch = newValue;
                                    config.write();
                                },
                            }),
                            ConfigToggle({
                                icon: 'calculate',
                                name: getString('Math Results'),
                                desc: getString('Show calculator results in search'),
                                initValue: config.value.search?.enableFeatures?.mathResults !== false,
                                onChange: (self, newValue) => {
                                    if (!config.value.search.enableFeatures) config.value.search.enableFeatures = {};
                                    config.value.search.enableFeatures.mathResults = newValue;
                                    config.write();
                                },
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('link_off', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Excluded Sites'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.search?.excludedSites?.join(', ') || 'None',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Edit excluded sites'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Excluded Sites',
                                                '--text=Enter comma-separated list of sites to exclude',
                                                '--entry-text=' + (config.value.search?.excludedSites?.join(', ') || '')])
                                                .then(sites => {
                                                    if (sites) {
                                                        config.value.search.excludedSites = sites.split(',').map(s => s.trim());
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),
                        // Timer Presets
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Timer Presets'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('timer', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Pomodoro'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${Math.floor((config.value.timers?.presets?.find(p => p.name === 'Pomodoro')?.duration || 1500) / 60)} minutes`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set Pomodoro duration'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Pomodoro Duration',
                                                '--text=Set duration in minutes',
                                                '--min-value=1',
                                                '--max-value=60',
                                                '--value=' + Math.floor((config.value.timers?.presets?.find(p => p.name === 'Pomodoro')?.duration || 1500) / 60)])
                                                .then(value => {
                                                    if (value) {
                                                        const preset = config.value.timers.presets.find(p => p.name === 'Pomodoro');
                                                        if (preset) preset.duration = parseInt(value) * 60;
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('coffee', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Short Break'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${Math.floor((config.value.timers?.presets?.find(p => p.name === 'Short Break')?.duration || 300) / 60)} minutes`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set short break duration'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Short Break Duration',
                                                '--text=Set duration in minutes',
                                                '--min-value=1',
                                                '--max-value=30',
                                                '--value=' + Math.floor((config.value.timers?.presets?.find(p => p.name === 'Short Break')?.duration || 300) / 60)])
                                                .then(value => {
                                                    if (value) {
                                                        const preset = config.value.timers.presets.find(p => p.name === 'Short Break');
                                                        if (preset) preset.duration = parseInt(value) * 60;
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('self_improvement', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Long Break'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: `${Math.floor((config.value.timers?.presets?.find(p => p.name === 'Long Break')?.duration || 900) / 60)} minutes`,
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set long break duration'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--scale',
                                                '--title=Long Break Duration',
                                                '--text=Set duration in minutes',
                                                '--min-value=5',
                                                '--max-value=60',
                                                '--value=' + Math.floor((config.value.timers?.presets?.find(p => p.name === 'Long Break')?.duration || 900) / 60)])
                                                .then(value => {
                                                    if (value) {
                                                        const preset = config.value.timers.presets.find(p => p.name === 'Long Break');
                                                        if (preset) preset.duration = parseInt(value) * 60;
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),
                        // Translation Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Translation Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('translate', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Default Language'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.sidebar?.translater?.to || 'en',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set default language'),
                                        onClicked: () => {
                                            const languages = Object.entries(config.value.sidebar?.translater?.languages || {})
                                                .map(([code, name]) => `${code}:${name}`);
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Default Language',
                                                '--text=Choose default language',
                                                '--entry-text=' + (config.value.sidebar?.translater?.to || 'en')])
                                                .then(lang => {
                                                    if (lang) {
                                                        if (!config.value.sidebar.translater) config.value.sidebar.translater = {};
                                                        config.value.sidebar.translater.to = lang.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Keyboard Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Keyboard Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('keyboard', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Keyboard Layout'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.onScreenKeyboard?.layout || 'qwerty_full',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set keyboard layout'),
                                        onClicked: () => {
                                            const layouts = ['qwerty_full', 'qwerty_compact', 'azerty_full', 'azerty_compact'];
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Keyboard Layout',
                                                '--text=Choose keyboard layout',
                                                '--entry-text=' + (config.value.onScreenKeyboard?.layout || 'qwerty_full')])
                                                .then(layout => {
                                                    if (layout) {
                                                        if (!config.value.onScreenKeyboard) config.value.onScreenKeyboard = {};
                                                        config.value.onScreenKeyboard.layout = layout.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Monitor Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Monitor Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('monitor', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Scale Method'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.monitors?.scaleMethod || 'division',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set scale method'),
                                        onClicked: () => {
                                            const methods = ['division', 'multiplication'];
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Scale Method',
                                                '--text=Choose scale method',
                                                '--entry-text=' + (config.value.monitors?.scaleMethod || 'division')])
                                                .then(method => {
                                                    if (method) {
                                                        if (!config.value.monitors) config.value.monitors = {};
                                                        config.value.monitors.scaleMethod = method.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Music Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Music Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('music_note', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Preferred Player'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.music?.preferredPlayer || 'plasma-browser-integration',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set preferred music player'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Preferred Music Player',
                                                '--text=Enter preferred music player',
                                                '--entry-text=' + (config.value.music?.preferredPlayer || 'plasma-browser-integration')])
                                                .then(player => {
                                                    if (player) {
                                                        if (!config.value.music) config.value.music = {};
                                                        config.value.music.preferredPlayer = player.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Brightness Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Brightness Settings'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('brightness_6', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Default Controller'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.brightness?.controllers?.default || 'auto',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set brightness controller'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Brightness Controller',
                                                '--text=Enter brightness controller',
                                                '--entry-text=' + (config.value.brightness?.controllers?.default || 'auto')])
                                                .then(controller => {
                                                    if (controller) {
                                                        if (!config.value.brightness) config.value.brightness = {};
                                                        if (!config.value.brightness.controllers) config.value.brightness.controllers = {};
                                                        config.value.brightness.controllers.default = controller.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                        ]),

                        // Internationalization Settings
                        Label({
                            hpack: 'start',
                            className: 'txt txt-bold margin-left-10 margin-top-10',
                            label: getString('Internationalization'),
                        }),
                        Subcategory([
                            Box({
                                className: 'spacing-h-5 configtoggle-box',
                                children: [
                                    MaterialIcon('language', 'small'),
                                    Box({
                                        vertical: true,
                                        children: [
                                            Label({
                                                xalign: 0,
                                                className: 'txt txt-small',
                                                label: getString('Language Code'),
                                            }),
                                            Label({
                                                xalign: 0,
                                                className: 'txt-small txt-subtext',
                                                label: config.value.i18n?.langCode || 'en',
                                            }),
                                        ]
                                    }),
                                    Box({ hexpand: true }),
                                    EditButton({
                                        tooltipText: getString('Set language code'),
                                        onClicked: () => {
                                            Utils.execAsync(['zenity', '--entry',
                                                '--title=Language Code',
                                                '--text=Enter language code (e.g., en, fr, de)',
                                                '--entry-text=' + (config.value.i18n?.langCode || 'en')])
                                                .then(code => {
                                                    if (code) {
                                                        if (!config.value.i18n) config.value.i18n = {};
                                                        config.value.i18n.langCode = code.trim();
                                                        config.write();
                                                    }
                                                })
                                                .catch(print);
                                        },
                                    }),
                                ]
                            }),
                            ConfigToggle({
                                icon: 'bug_report',
                                name: getString('Extra Logs'),
                                desc: getString('Enable additional logging for translations'),
                                initValue: config.value.i18n?.extraLogs || false,
                                onChange: (self, newValue) => {
                                    if (!config.value.i18n) config.value.i18n = {};
                                    config.value.i18n.extraLogs = newValue;
                                    config.write();
                                },
                            }),
                        ]),
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
