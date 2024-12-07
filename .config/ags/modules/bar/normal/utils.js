import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button } = Widget;

const utilButtonCache = new Map();

const UtilButton = ({ name, icon, onClicked }) => {
    const key = `${name}-${icon}`;
    if (!utilButtonCache.has(key)) {
        utilButtonCache.set(key, Button({
            vpack: 'center',
            tooltipText: name,
            onClicked: onClicked,
            className: 'icon-material prim-txt txt-norm',
            label: `${icon}`,
        }));
    }
    return utilButtonCache.get(key);
}

const Utilities = () => {
    let unsubscriber = () => {};
    let wallpaperFolder = '';
    let status = true;

    const change_wallpaper_btn = UtilButton({
        name: getString('Change wallpaper'), 
        icon: 'image', 
        onClicked: () => App.toggleWindow('wallselect'),
    });

    const box = Box({
        hpack: 'center',
        className: 'spacing-h-10',
        children: [
            UtilButton({
                name: getString('Screen snip'), icon: 'screenshot_region', onClicked: () => {
                    Utils.execAsync(`${App.configDir}/scripts/grimblast.sh copy area`)
                        .catch(print);
                }
            }),
            UtilButton({
                name: getString('Color picker'), icon: 'colorize', onClicked: () => {
                    Utils.execAsync(['hyprpicker', '-a']).catch(print);
                }
            }),
            
            change_wallpaper_btn
        ]
    });

    unsubscriber = userOptions.subscribe((userOptions) => {
        wallpaperFolder = userOptions.bar.wallpaper_folder;
        const current_status = typeof wallpaperFolder === 'string';
        if (status !== current_status) {
            if (current_status) {
                box.add(change_wallpaper_btn);
            } else {
                box.remove(change_wallpaper_btn);
            }
            status = current_status;
        }
    });

    box.on('destroy', () => { unsubscriber(); });
    return box;
}

export default Utilities;
