import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { currentDockMode } from '../../../variables.js';
import { DockLayouts } from '../layouts.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';

const getConfig = () => {
    try {
        return JSON.parse(Utils.readFile(`${App.configDir}/modules/.configuration/user_options.default.json`));
    } catch (error) {
        console.error('Error reading config:', error);
        return { dock: { pinnedApps: [], searchPinnedAppIcons: true } };
    }
};

const getIconSize = () => {
    const config = getConfig();
    const mode = DockLayouts[currentDockMode.value]?.name?.toLowerCase() || 'default';
    return config.dock.iconSizes?.[mode] || config.dock.pinnedAppIconSize || 32;
};

const findAppIcon = (name) => {
    const config = getConfig();
    if (!config.dock.searchPinnedAppIcons) return name;

    // Try different icon naming schemes
    const iconNames = [
        name,
        name.toLowerCase(),
        name.toLowerCase().replace(/\s+/g, '-'),
        name.toLowerCase().replace(/\s+/g, ''),
    ];

    for (const iconName of iconNames) {
        const icon = Utils.lookUpIcon(iconName);
        if (icon) return iconName;
    }

    return name;
};

export const DockPinnedApps = () => {
    const pinnedApps = Widget.Box({
        className: 'spacing-h-5 pinned-apps',
    });

    function updatePinnedApps() {
        const config = getConfig();
        const iconSize = getIconSize();
        
        const children = config.dock.pinnedApps.map(app => {
            const icon = Widget.Icon({
                icon: findAppIcon(app),
                size: iconSize,
            });

            return Widget.Button({
                className: 'pinned-app-btn',
                child: icon,
                tooltipText: app,
                onClicked: () => Utils.execAsync(['bash', '-c', `gtk-launch ${app.toLowerCase()}.desktop || ${app.toLowerCase()}`]),
                setup: setupCursorHover,
            });
        });

        pinnedApps.children = children;
    }

    // Update when dock mode changes
    currentDockMode.connect('changed', updatePinnedApps);
    
    // Initial update
    updatePinnedApps();

    return pinnedApps;
};
