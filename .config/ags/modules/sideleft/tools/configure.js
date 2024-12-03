const { GLib } = imports.gi;
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { Box, Button, Icon, Label, Scrollable, Slider, Stack } = Widget;
const { execAsync, exec } = Utils;
// import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { setupCursorHover } from "../../.widgetutils/cursorhover.js";
import {
    ConfigGap,
    ConfigSpinButton,
    ConfigToggle,
} from "../../.commonwidgets/configwidgets.js";
const getHyprlandBorderSize = () => {
    try {
        const output = exec(`hyprctl getoption -j general:border_size`);
        const parsed = JSON.parse(output);
        return parsed["int"] || 0; // Default to 0 if undefined
    } catch (error) {
        print(`Failed to fetch border size: ${error}`);
        return 0; // Default value
    }
};

// Function to fetch the current corner rounding value from Hyprland
const getHyprlandRounding = () => {
    try {
        const output = exec(`hyprctl getoption -j decoration:rounding`);
        const parsed = JSON.parse(output);
        return parsed["float"] || 0; // Default to 0 if undefined
    } catch (error) {
        print(`Failed to fetch rounding value: ${error}`);
        return 0; // Default value
    }
};

const getHyprlandGapValue = (option) => {
    try {
        const output = exec(`hyprctl getoption -j ${option}`);
        const parsed = JSON.parse(output);
        const customValue = parsed["custom"];
        // Extract the first number from the "custom" field
        const gapValue = Number(customValue.split(" ")[0]);
        return isNaN(gapValue) ? 0 : gapValue; // Fallback to 0 if invalid
    } catch (error) {
        print(`Failed to fetch option ${option}: ${error}`);
        return 0; // Default value
    }
};

const HyprlandToggle = ({
    icon,
    name,
    desc = null,
    option,
    enableValue = 1,
    disableValue = 0,
    extraOnChange = () => {},
}) =>
    ConfigToggle({
        icon: icon,
        name: name,
        desc: desc,
        initValue:
            JSON.parse(exec(`hyprctl getoption -j ${option}`))["int"] != 0,
        onChange: (self, newValue) => {
            execAsync([
                "hyprctl",
                "keyword",
                option,
                `${newValue ? enableValue : disableValue}`,
            ]).catch(print);
            extraOnChange(self, newValue);
        },
    });

const HyprlandSpinButton = ({ icon, name, desc = null, option, ...rest }) =>
    ConfigSpinButton({
        icon: icon,
        name: name,
        desc: desc,
        initValue: Number(
            JSON.parse(exec(`hyprctl getoption -j ${option}`))["int"],
        ),
        onChange: (self, newValue) => {
            execAsync(["hyprctl", "keyword", option, `${newValue}`]).catch(
                print,
            );
        },
        ...rest,
    });

const Subcategory = (children) =>
    Box({
        className: "margin-left-20",
        vertical: true,
        children: children,
    });

export default (props) => {
    const ConfigSection = ({ name, children }) =>
        Box({
            vertical: true,
            className: "spacing-v-5",
            children: [
                Label({
                    hpack: "center",
                    className: "txt txt-large margin-left-10",
                    label: name,
                }),
                Box({
                    className: "margin-left-10 margin-right-10",
                    vertical: true,
                    children: children,
                }),
            ],
        });
    const mainContent = Scrollable({
        vexpand: true,
        child: Box({
            vertical: true,
            className: "spacing-v-10 padding-top-2",
            children: [
                ConfigSection({
                    name: getString("Effects"),
                    children: [
                        ConfigToggle({
                            icon: "border_clear",
                            name: getString("Transparency"),
                            desc: getString(
                                "[AGS]\nMake shell elements transparent\nBlur is also recommended if you enable this",
                            ),
                            initValue:
                                exec(
                                    `bash -c "sed -n \'2p\' ${GLib.get_user_state_dir()}/ags/user/colormode.txt"`,
                                ) == "transparent",
                            onChange: (self, newValue) => {
                                const transparency =
                                    newValue == 0 ? "opaque" : "transparent";
                                console.log(transparency);
                                execAsync([
                                    `bash`,
                                    `-c`,
                                    `mkdir -p ${GLib.get_user_state_dir()}/ags/user && sed -i "2s/.*/${transparency}/"  ${GLib.get_user_state_dir()}/ags/user/colormode.txt`,
                                ])
                                    .then(
                                        execAsync([
                                            "bash",
                                            "-c",
                                            `${App.configDir}/scripts/color_generation/switchcolor.sh`,
                                        ]),
                                    )
                                    .catch(print);
                            },
                        }),

                        HyprlandToggle({
                            icon: "blur_on",
                            name: getString("Blur"),
                            desc: getString(
                                "[Hyprland]\nEnable blur on transparent elements\nDoesn't affect performance/power consumption unless you have transparent windows.",
                            ),
                            option: "decoration:blur:enabled",
                        }),
                        HyprlandToggle({
                            icon: "stack_off",
                            name: getString("X-ray"),
                            desc: getString(
                                "[Hyprland]\nMake everything behind a window/layer except the wallpaper not rendered on its blurred surface\nRecommended to improve performance (if you don't abuse transparency/blur) ",
                            ),
                            option: "decoration:blur:xray",
                        }),
                        HyprlandToggle({
                            icon: "animation",
                            name: getString("Animations"),
                            desc: getString(
                                "[Hyprland] [GTK]\nEnable animations",
                            ),
                            option: "animations:enabled",
                            extraOnChange: (self, newValue) =>
                                execAsync([
                                    "gsettings",
                                    "set",
                                    "org.gnome.desktop.interface",
                                    "enable-animations",
                                    `${newValue}`,
                                ]),
                        }),
                        Subcategory([
                            ConfigSpinButton({
                                icon: "clear_all",
                                name: getString("Choreography delay"),
                                desc: getString(
                                    "In milliseconds, the delay between animations of a series",
                                ),
                                initValue:
                                    userOptions.asyncGet().animations
                                        .choreographyDelay,
                                step: 10,
                                minValue: 0,
                                maxValue: 1000,
                                onChange: (self, newValue) => {
                                    userOptions.asyncGet().animations.choreographyDelay =
                                        newValue;
                                },
                            }),
                        ]),
                        Subcategory([
                            HyprlandSpinButton({
                                icon: "target",
                                name: getString("Size"),
                                desc: getString(
                                    "[Hyprland]\nAdjust the blur radius. Generally doesn't affect performance\nHigher = more color spread",
                                ),
                                option: "decoration:blur:size",
                                minValue: 1,
                                maxValue: 1000,
                            }),
                            HyprlandSpinButton({
                                icon: "repeat",
                                name: getString("Passes"),
                                desc: getString(
                                    "[Hyprland] Adjust the number of runs of the blur algorithm\nMore passes = more spread and power consumption\n4 is recommended\n2- would look weird and 6+ would look lame.",
                                ),
                                option: "decoration:blur:passes",
                                minValue: 1,
                                maxValue: 10,
                            }),
                        ]),
                        Subcategory([
                            HyprlandSpinButton({
                                icon: "arrows_input",
                                name: getString("Gaps In"),
                                desc: getString(
                                    "[Hyprland]\nSet the size of gaps between windows.\nHigher values increase spacing.",
                                ),
                                option: "general:gaps_in",
                                initValue:
                                    getHyprlandGapValue("general:gaps_in"),
                                minValue: 0,
                                maxValue: 50, // Adjust as needed
                                step: 1,
                                onChange: (self, newValue) => {
                                    execAsync([
                                        "hyprctl",
                                        "keyword",
                                        "general:gaps_in",
                                        `${newValue} ${newValue} ${newValue} ${newValue}`,
                                    ]).catch((error) =>
                                        print(
                                            `Failed to set gaps_in: ${error}`,
                                        ),
                                    );
                                },
                            }),
                            HyprlandSpinButton({
                                icon: "arrows_output",
                                name: getString("Gaps Out"),
                                desc: getString(
                                    "[Hyprland]\nSet the size of gaps around the screen edge.\nHigher values increase spacing.",
                                ),
                                option: "general:gaps_out",
                                initValue:
                                    getHyprlandGapValue("general:gaps_out"),
                                minValue: 0,
                                maxValue: 50, // Adjust as needed
                                step: 1,
                                onChange: (self, newValue) => {
                                    execAsync([
                                        "hyprctl",
                                        "keyword",
                                        "general:gaps_out",
                                        `${newValue} ${newValue} ${newValue} ${newValue}`,
                                    ]).catch((error) =>
                                        print(
                                            `Failed to set gaps_out: ${error}`,
                                        ),
                                    );
                                },
                            }),
                            ConfigSpinButton({
                                icon: "border_style",
                                name: "Border Width",
                                desc: "Adjust the thickness of window borders.",
                                initValue: getHyprlandBorderSize(),
                                minValue: 0,
                                maxValue: 20, // Adjust as needed
                                step: 1,
                                onChange: (self, newValue) => {
                                    execAsync([
                                        "hyprctl",
                                        "keyword",
                                        "general:border_size",
                                        `${newValue}`,
                                    ]).catch(print);
                                },
                            }),
                            ConfigSpinButton({
                                icon: "rounded_corner",
                                name: "Corner Rounding",
                                desc: "Adjust the radius of window corners.",
                                initValue: getHyprlandRounding(),
                                minValue: 0,
                                maxValue: 50, // Adjust as needed
                                step: 1,
                                onChange: (self, newValue) => {
                                    execAsync([
                                        "hyprctl",
                                        "keyword",
                                        "decoration:rounding",
                                        `${newValue}`,
                                    ]).catch(print);
                                },
                            }),
                        ]),
                        ConfigGap({}),
                    ],
                }),
                ConfigSection({
                    name: getString("Developer"),
                    children: [
                        ConfigToggle({
                            icon: "developer_mode",
                            name: getString("Developer mode"),
                            desc: getString(
                                "Show development widgets\nCurrently controls battery widget visibility",
                            ),
                            initValue: globalThis.devMode.value,
                            onChange: (self, newValue) => {
                                globalThis.devMode.setValue(newValue);
                            },
                        }),
                        HyprlandToggle({
                            icon: "speed",
                            name: getString("Show FPS"),
                            desc: getString(
                                "[Hyprland]\nShow FPS overlay on top-left corner",
                            ),
                            option: "debug:overlay",
                        }),
                        HyprlandToggle({
                            icon: "sort",
                            name: getString("Log to stdout"),
                            desc: getString(
                                "[Hyprland]\nPrint LOG, ERR, WARN, etc. messages to the console",
                            ),
                            option: "debug:enable_stdout_logs",
                        }),
                        HyprlandToggle({
                            icon: "motion_sensor_active",
                            name: getString("Damage tracking"),
                            desc: getString(
                                "[Hyprland]\nEnable damage tracking\nGenerally, leave it on.\nTurn off only when a shader doesn't work",
                            ),
                            option: "debug:damage_tracking",
                            enableValue: 2,
                        }),
                        HyprlandToggle({
                            icon: "destruction",
                            name: getString("Damage blink"),
                            desc: getString(
                                "[Hyprland] [Epilepsy warning!]\nShow screen damage flashes",
                            ),
                            option: "debug:damage_blink",
                        }),
                    ],
                }),
            ],
        }),
    });
    const footNote = Box({
        homogeneous: true,
        children: [
            Label({
                hpack: "center",
                className: "txt-arabic  margin-5",
                label: getString("آحَّا"),
            }),
        ],
    });
    return Box({
        ...props,
        className: "spacing-v-5",
        vertical: true,
        children: [
            mainContent,
            // footNote,
        ],
    });
};
