const { Gtk } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Button } = Widget;
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';

const AppButton = ({ client }) => {
    return Button({
        className: `bar-active-app ${client.class === Hyprland.active.client.class ? 'focused' : ''}`,
        onClicked: () => {
            Utils.execAsync(['hyprctl', 'dispatch', 'focuswindow', `address:${client.address}`]).catch(print);
        },
        child: Box({
            className: 'spacing-h-5 txt-norm',
            children: [
                Widget.Icon({
                    icon: client.class ? `${client.class.toLowerCase()}` : 'application-default',
                    size: 22,
                }),
            ],
        }),
        tooltipText: client.title || client.class || 'Unknown',
        setup: setupCursorHover,
    });
};

export default () => {
    return Box({
        className: 'bar-active-apps spacing-h-5',
        connections: [[Hyprland, box => {
            const clients = Hyprland.clients;
            box.children = clients
                .filter(client => !client.class?.includes('unset'))
                .map(client => AppButton({ client }));
        }]],
    });
};
