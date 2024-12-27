const { Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button } = Widget;
import Applications from 'resource:///com/github/Aylur/ags/service/applications.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';

const configPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
const readConfig = () => JSON.parse(Utils.readFile(configPath));

const AppButton = ({ icon, name, ...rest }) => {
    return Button({
        className: 'bar-pinned-btn',
        child: Box({
            className: 'spacing-h-5 txt-norm',
            hpack: 'center',
            hexpand: true,
            children: [
                Widget.Icon({
                    icon: icon || '',
                    size: 36,
                }),
            ],
        }),
        tooltipText: name,
        setup: setupCursorHover,
        ...rest,
    });
};

export default () => {
    const config = readConfig();
    const pinnedApps = config.modules?.pinnedApps || [];
    
    return Box({
        className: 'bar-pinned-apps spacing-h-5',
        children: pinnedApps.map(appId => {
            const app = Applications.list.find(a => 
                a.desktop?.toLowerCase().includes(appId.toLowerCase()) ||
                a.name?.toLowerCase().includes(appId.toLowerCase())
            );
            
            if (!app) return null;
            
            return AppButton({
                icon: app.icon_name,
                name: app.name,
                onClicked: () => {
                    app.launch();
                },
            });
        }).filter(Boolean),
    });
};
