const { Gio, GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import { darkMode } from '../../.miscutils/system.js';

const LIGHTDARK_FILE = `${GLib.get_user_state_dir()}/ags/user/colormode.txt`;

const schemeOptions = [
    { icon: 'palette', value: 'tonalspot', tooltip: 'Tonal Spot' },
    { icon: 'restaurant', value: 'fruitsalad', tooltip: 'Fruit Salad' },
    { icon: 'music_note', value: 'fidelity', tooltip: 'Fidelity' },
    { icon: 'looks', value: 'rainbow', tooltip: 'Rainbow' },
    { icon: 'tonality', value: 'neutral', tooltip: 'Neutral' },
    { icon: 'contrast', value: 'monochrome', tooltip: 'Monochrome' },
    { icon: 'theater_comedy', value: 'expressive', tooltip: 'Expressive' },
    { icon: 'auto_awesome', value: 'vibrant', tooltip: 'Vibrant' },
];

const ColorButton = ({ icon, value, tooltip }) => Widget.Button({
    className: 'bar-colorscheme-btn onSurfaceVariant',
    tooltipText: tooltip,
    onClicked: () => {
        Utils.execAsync([`bash`, `-c`, 
            `mkdir -p ${GLib.get_user_state_dir()}/ags/user && ` +
            `sed -i "3s/.*/${value}/" ${LIGHTDARK_FILE} && ` +
            `${App.configDir}/scripts/color_generation/switchcolor.sh`
        ]).catch(print);
    },
    setup: setupCursorHover,
    child: MaterialIcon(icon, 'norm'),
});

const DarkModeToggle = () => {
    const stack = Widget.Stack({
        transition: 'slide_left_right',
        transitionDuration: 200,
        items: [
            ['light', MaterialIcon('light_mode', 'norm')],
            ['dark', MaterialIcon('dark_mode', 'norm')],
        ],
    });
    
    return Widget.Button({
        className: 'bar-colorscheme-btn onSurfaceVariant',
        tooltipText: 'Toggle Dark Mode',
        onClicked: () => {
            darkMode.value = !darkMode.value;
        },
        setup: (self) => {
            self.hook(darkMode, () => {
                stack.shown = darkMode.value ? 'dark' : 'light';
            });
            setupCursorHover(self);
        },
        child: stack,
    });
};

const TransparencyToggle = () => {
    const currentTransparency = Utils.exec(`bash -c "sed -n '2p' ${LIGHTDARK_FILE}"`);
    const isTransparent = currentTransparency.trim() === "transparent";
    
    const stack = Widget.Stack({
        transition: 'slide_left_right',
        transitionDuration: 200,
        items: [
            ['opaque', MaterialIcon('blur_off', 'norm')],
            ['transparent', MaterialIcon('blur_on', 'norm')],
        ],
    });

    return Widget.Button({
        className: 'bar-colorscheme-btn onSurfaceVariant',
        tooltipText: 'Toggle Transparency',
        onClicked: (self) => {
            self._isTransparent = !self._isTransparent;
            stack.shown = self._isTransparent ? 'transparent' : 'opaque';
            
            const newValue = self._isTransparent ? "transparent" : "opaque";
            Utils.execAsync([`bash`, `-c`,
                `mkdir -p ${GLib.get_user_state_dir()}/ags/user && ` +
                `sed -i "2s/.*/${newValue}/" ${LIGHTDARK_FILE} && ` +
                `${App.configDir}/scripts/color_generation/switchcolor.sh`
            ]).catch(print);
        },
        setup: (self) => {
            self._isTransparent = isTransparent;
            stack.shown = isTransparent ? 'transparent' : 'opaque';
            setupCursorHover(self);
        },
        child: stack,
    });
};

export default () => Widget.Box({
    className: 'spacing-h-5 bar-group-margin onSurfaceVariant bar-colorscheme',
    children: [
        DarkModeToggle(),
        TransparencyToggle(),
        Widget.Separator({ className: 'bar-separator-line' }),
        ...schemeOptions.map(opt => ColorButton(opt)),
    ],
});
