import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import { currentDockMode } from '../../../variables.js';
import { DockLayouts } from '../layouts.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import App from 'resource:///com/github/Aylur/ags/app.js';

const getIconSize = () => {
    try {
        const config = JSON.parse(Utils.readFile(`${App.configDir}/modules/.configuration/user_options.default.json`));
        const mode = DockLayouts[currentDockMode.value]?.name?.toLowerCase() || 'default';
        return config.dock.iconSizes?.[mode] || config.dock.activeAppIconSize || 32;
    } catch (error) {
        console.error('Error reading config:', error);
        return 32; // fallback size
    }
};

export const DockActiveApps = () => {
    const activeApps = Widget.Box({
        className: 'spacing-h-5 active-apps',
    });

    // Update active window list
    function updateActiveApps() {
        const iconSize = getIconSize();
        const children = Utils.Hyprland.clients.map(client => {
            const icon = Widget.Icon({
                icon: client.class,
                size: iconSize,
            });
            return Widget.Button({
                className: client.address === Utils.Hyprland.active.client.address
                    ? 'active-app-btn active'
                    : 'active-app-btn',
                child: icon,
                tooltipText: client.title,
                onClicked: () => Utils.Hyprland.messageAsync(`dispatch focuswindow address:${client.address}`),
                setup: setupCursorHover,
            });
        });
        activeApps.children = children;
    }

    // Connect to window events
    Utils.Hyprland.connect('client-added', updateActiveApps);
    Utils.Hyprland.connect('client-removed', updateActiveApps);
    Utils.Hyprland.connect('active', updateActiveApps);
    currentDockMode.connect('changed', updateActiveApps);

    return activeApps;
};
