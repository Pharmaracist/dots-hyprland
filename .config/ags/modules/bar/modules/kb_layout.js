import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { languages } from "../../.commonwidgets/statusicons_languages.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
const { GLib } = imports.gi;

const ANIMATION_DURATION = 200; // Default animation duration

/**
 * Creates a keyboard layout widget using Hyprland's keyboard layout information.
 */
const createKeyboardWidget = () => {
    // Get current keyboard layouts
    const deviceData = JSON.parse(Utils.exec("hyprctl -j devices"));
    const layouts = deviceData.keyboards
        .find(kb => kb.main)?.layout
        .split(",")
        .map(l => l.trim()) || ["us"];

    // Create stack for layout labels
    const layoutLabels = layouts.reduce((acc, layout) => {
        const lang = languages.find(l => l.layout === layout);
        const label = lang ? lang.layout.toUpperCase() : layout.toUpperCase();
        acc[layout] = Widget.Label({ 
            label,
            className: 'txt-small sec-txt txt-bold',
            hpack: 'center',
            vpack: 'center',
            justify: 'center'
        });
        return acc;
    }, { 
        "unknown": Widget.Label({ 
            label: "?",
            className: 'txt-small sec-txt txt-bold',
            hpack: 'center',
            vpack: 'center',
            justify: 'center'
        })
    });

    const labelStack = Widget.Stack({
        transition: "slide_up_down",
        transitionDuration: ANIMATION_DURATION,
        vpack: 'center',
        children: layoutLabels,
        setup: self => self.hook(Hyprland, (stack, kbName, layoutName) => {
            try {
                const deviceData = JSON.parse(Utils.exec("hyprctl -j devices"));
                const mainKeyboard = deviceData.keyboards.find(kb => kb.main);
                const currentLayout = mainKeyboard?.active_keymap || "unknown";
                
                // Find the matching layout
                const layout = Object.keys(layoutLabels).find(l => 
                    currentLayout.toLowerCase().includes(l.toLowerCase())
                ) || "unknown";
                
                stack.shown = layout;
                print('Keyboard layout changed to:', layout);
            } catch (error) {
                console.error('Error updating keyboard layout:', error);
                stack.shown = "unknown";
            }
        }, "keyboard-layout"),
    });

    // Create the final widget with constant icon
    return Widget.Box({
        vertical: true,
        vpack: 'center',
        className: 'keyboard-layout-box',
        homogeneous: false,
        spacing: 4,
        children: [
            Widget.Box({
                hpack: 'center',
                vpack: 'center',
                child: Widget.Icon({
                    icon: 'keyboard',
                    className: 'txt-norm material-icon',
                    size: 20,
                    vpack: 'center'
                })
            }),
            Widget.Box({
                hpack: 'center',
                vpack: 'center',
                child: labelStack
            })
        ]
    });
};

/**
 * Main widget export.
 */
export default () => Widget.Box({
    className: "spacing-h-10",
    vpack: 'center',
    children: [createKeyboardWidget()],
});
